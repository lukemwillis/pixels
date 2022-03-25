import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function Grid() {
  return (
    <TransformWrapper maxScale={100} centerOnInit={true} centerZoomedOut={true}>
      {({ zoomToElement, ...rest }) => (
        <TransformComponent wrapperClass="Wrap">
          <div className="Grid">
            {Array.from(Array(10000).keys()).map((i) => (
              <a id={i + 1} href={`#${i + 1}`} key={i} onClick={() => zoomToElement(`${i + 1}`)}>
                NFT #{i + 1} details
              </a>
            ))}
          </div>
        </TransformComponent>
      )}
    </TransformWrapper>
  );
}

export default Grid;
