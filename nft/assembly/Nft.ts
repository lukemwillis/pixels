import { authority, Base58, Protobuf, System } from "koinos-as-sdk";
import { nft } from "./proto/nft";
import { State } from "./State";

export class Nft {
  _name: string = "Pixel";
  _symbol: string = "PXL";
  _quantity: number = 1000000;

  _contractId: Uint8Array;
  _state: State;

  constructor() {
    this._contractId = System.getContractId();
    this._state = new State(this._contractId);
  }

  _isTokenIdValid(tokenId: number) {
    return 0 < tokenId && tokenId <= this._quantity;
  }

  _isColorValid(color: string) {
    if (color.length !== 7) return false;
    if (color.charAt(0) !== '#') return false;
    
    for (let i = 1; i < 7; i++) {
      if (isNaN(parseInt(color.charAt(i), 16))) return false;
    }

    return true;
  }

  name(args: nft.name_arguments): nft.name_result {
    return new nft.name_result(this._name);
  }

  symbol(args: nft.symbol_arguments): nft.symbol_result {
    return new nft.symbol_result(this._symbol);
  }

  color_of(args: nft.color_of_arguments): nft.color_of_result {
    const token_id = args.token_id;
    const res = new nft.color_of_result();

    const token = this._state.GetToken(token_id);

    if (token) {
      res.value = token.color;
    }

    return res;
  }

  balance_of(args: nft.balance_of_arguments): nft.balance_of_result {
    const owner = args.owner as Uint8Array;

    const balanceObj = this._state.GetBalance(owner);

    const res = new nft.balance_of_result();
    res.value = balanceObj.value;

    return res;
  }

  owner_of(args: nft.owner_of_arguments): nft.owner_of_result {
    const token_id = args.token_id;
    const res = new nft.owner_of_result();

    const token = this._state.GetToken(token_id);

    if (token) {
      res.value = token.owner;
    }

    return res;
  }

  mint(args: nft.mint_arguments): nft.mint_result {
    const to = args.to as Uint8Array;
    const token_id = args.token_id;
    const color = args.color;

    const res = new nft.mint_result(false);

    // only this contract can mint new tokens
    System.requireAuthority(authority.authorization_type.contract_call, this._contractId);

    let token = this._state.GetToken(token_id);

    // check that the token has not already been minted
    if (token) {
      System.log('token already minted');
      return res;
    }

    if (!this._isTokenIdValid(token_id)) {
      System.log('token id is invalid');
      return res;
    }

    // assign the new token's owner and color
    token = new nft.token_object(to);
    if (color !== null) {
      if (this._isColorValid(color as string)) {
        token.color = color;
      } else {
        System.log('ignoring invalid color input');
      }
    }

    // update the owner's balance
    const balance = this._state.GetBalance(to);
    balance.value += 1;

    this._state.SaveBalance(to, balance);
    this._state.SaveToken(token_id, token);

    // generate event
    const mintEvent = new nft.mint_event(to, token_id, color);
    const impacted = [to];

    System.event('nft.mint', Protobuf.encode(mintEvent, nft.mint_event.encode), impacted);

    res.value = true;

    return res;
  }

  paint(args: nft.paint_arguments): nft.paint_result {
    const token_id = args.token_id;
    const color = args.color;

    const res = new nft.paint_result(false);

    // check that the token exists
    let token = this._state.GetToken(token_id);
    if (!token) {
      System.log('nonexistent token');
      return res;
    }

    // check token color
    if (color === null || !this._isColorValid(color as string)) {
      System.log('color is invalid');
      return res;
    }

    // paint
    token.color = color;
    this._state.SaveToken(token_id, token);

    // generate event
    const paintEvent = new nft.paint_event(token_id, color);
    System.event('nft.paint', Protobuf.encode(paintEvent, nft.paint_event.encode), []);

    res.value = true;

    return res;
  }

  transfer(args: nft.transfer_arguments): nft.transfer_result {
    const from = args.from as Uint8Array;
    const to = args.to as Uint8Array;
    const token_id = args.token_id;

    const b58From = Base58.encode(from);

    const res = new nft.transfer_result(false);

    // require authority of the from address
    System.requireAuthority(authority.authorization_type.contract_call, from);

    // check that the token exists
    let token = this._state.GetToken(token_id);

    if (!token) {
      System.log('nonexistent token');
      return res;
    }

    const owner = token.owner as Uint8Array;
    const b58Owner = Base58.encode(owner);

    if (b58Owner != b58From) {
      System.log('transfer caller is not owner');
      return res;
    }

    // update the balances
    // from
    const fromBalance = this._state.GetBalance(from);
    fromBalance.value -= 1;
    this._state.SaveBalance(from, fromBalance);

    // to
    const toBalance = this._state.GetBalance(to);
    toBalance.value += 1;
    this._state.SaveBalance(to, toBalance);

    // update token owner
    token.owner = to;
    this._state.SaveToken(token_id, token);

    // generate event
    const transferEvent = new nft.transfer_event(from, to, token_id);
    const impacted = [to, from];

    System.event('nft.transfer', Protobuf.encode(transferEvent, nft.transfer_event.encode), impacted);

    res.value = true;

    return res;
  }
}
