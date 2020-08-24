import React from "react";
import { Row, Image, Modal, Card, ButtonGroup, Button } from "react-bootstrap";
import { IoMdPlay, IoMdTrash } from "react-icons/io";
import { MdQueue, MdEdit, MdPlaylistAdd } from "react-icons/md";

class TrackItem extends React.Component {
  constructor() {
    super();
    this.state = { showModal: false, mode: "Fit" };
  }

  render() {
    return (
      <>
        <Row>
          <Card
            border={this.props.selected ? "success" : null}
            className="p-1 mt-1 w-100 d-flex align-items-center flex-row"
            onClick={() => {
              this.setState({ showModal: true });
            }}
          >
            <img
              src={"/" + this.props.name + ".png"}
              width="50px"
              className="m-2"
            />
            <h3 className="m-0 p-0 w-100 text-truncate">{this.props.name}</h3>
          </Card>
        </Row>

        <Modal
          show={this.state.showModal}
          size="lg"
          dialogClassName="mh-100"
          centered
          onHide={() => this.setState({ showModal: false })}
        >
          <Modal.Header
            closeButton
            className="d-flex align-items-center justify-content-between"
          >
            <Modal.Title className="text-truncate w-100">
              {this.props.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ minHeight: 100 }}>
            <Row className="w-100 mx-auto d-flex align-items-center justify-content-between">
              <div>
                <IoMdPlay
                  size="1.5em"
                  className="icon-btn"
                  onClick={() => {
                    this.setState({ showModal: false });
                    this.props.onClickedFn(
                      this.props.name +
                        (this.state.mode == "Fill" ? " (fill)" : ""),
                      "play"
                    );
                  }}
                />
                <MdQueue
                  size="1.5em"
                  className="ml-2 icon-btn"
                  onClick={() => {
                    this.setState({ showModal: false });
                    this.props.onClickedFn(
                      this.props.name +
                        (this.state.mode == "Fill" ? " (fill)" : ""),
                      "queue"
                    );
                  }}
                />
                <MdPlaylistAdd
                  size="1.5em"
                  className="ml-2 icon-btn"
                  onClick={() => {
                    this.setState({ showModal: false });
                    this.props.onClickedFn(
                      this.props.name +
                        (this.state.mode == "Fill" ? " (fill)" : ""),
                      "addToPlaylist"
                    );
                  }}
                />
                <MdEdit
                  size="1.5em"
                  className="ml-2 icon-btn"
                  onClick={() => {
                    this.setState({ showModal: false });
                    this.props.onClickedFn(this.props.name, "rename");
                  }}
                />
                <IoMdTrash
                  size="1.5em"
                  className="ml-2 icon-btn"
                  onClick={() => {
                    this.setState({ showModal: false });
                    this.props.onClickedFn(this.props.name, "delete");
                  }}
                />
              </div>
              <ButtonGroup>
                <Button
                  variant={"Fit" == this.state.mode ? "light" : "outline-light"}
                  onClick={() => this.setState({ mode: "Fit" })}
                >
                  Fit
                </Button>
                <Button
                  variant={
                    "Fill" == this.state.mode ? "light" : "outline-light"
                  }
                  onClick={() => this.setState({ mode: "Fill" })}
                >
                  Fill
                </Button>
              </ButtonGroup>
            </Row>
            <Image
              src={
                "/" +
                this.props.name +
                (this.state.mode == "Fill" ? " (fill)" : "") +
                ".png"
              }
              fluid
            />
          </Modal.Body>
        </Modal>
      </>
    );
  }
}

export default TrackItem;
