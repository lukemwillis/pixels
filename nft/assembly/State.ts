import { chain, Protobuf, System } from "koinos-as-sdk";
import { nft } from "./proto/nft";

const TOKEN_SPACE_ID = 0;
const BALANCE_SPACE_ID = 1;

export class State {
  contractId: Uint8Array;
  tokenSpace: chain.object_space;
  balanceSpace: chain.object_space;

  constructor(contractId: Uint8Array) {
    this.contractId = contractId;

    this.tokenSpace = new chain.object_space(false, contractId, TOKEN_SPACE_ID);
    this.balanceSpace = new chain.object_space(false, contractId, BALANCE_SPACE_ID);
  }

  GetToken(tokenId: u64): nft.token_object | null {
    const token = System.getObject<string, nft.token_object>(this.tokenSpace, tokenId.toString(), nft.token_object.decode);

    return token;
  }

  SaveToken(tokenId: u64, token: nft.token_object): void {
    System.putObject(this.tokenSpace, tokenId.toString(), token, nft.token_object.encode);
  }

  GetBalance(owner: Uint8Array): nft.balance_object {
    const balance = System.getObject<Uint8Array, nft.balance_object>(this.balanceSpace, owner, nft.balance_object.decode);

    if (balance) {
      return balance;
    }

    return new nft.balance_object();
  }

  SaveBalance(owner: Uint8Array, balance: nft.balance_object): void {
    System.putObject(this.balanceSpace, owner, balance, nft.balance_object.encode);
  }
}
