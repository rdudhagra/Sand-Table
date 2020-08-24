import React from "react";
import { Col, Card, Image, Modal, Row, Badge } from "react-bootstrap";
import { IoMdPlay, IoMdPause, IoMdSquare, IoMdRepeat } from "react-icons/io";
import RangeSlider from "react-bootstrap-range-slider";
import Axios from "axios";
import TrackItem from "./TrackItem.jsx";

class Controls extends React.Component {
  constructor() {
    super();
    this.state = {
      showModal: false,
      isPaused: false,
      trackSelected: false,
      speed: 100,
      repeat: false,
    };
    this.sendControl = this.sendControl.bind(this);
  }

  componentDidMount() {
    Axios.get("/tracks/isPaused").then((v) => {
      this.setState({ isPaused: v.data });
    });
    Axios.get("/tracks/speed").then((v) => {
      this.setState({ speed: v.data });
    });
    Axios.get("/tracks/repeat").then((v) => {
      this.setState({ repeat: v.data });
    });
  }

  sendControl(cmd) {
    Axios.post("/tracks/control", { cmd: cmd }).then(() => {
      Axios.get("/tracks/isPaused").then((v) => {
        this.setState({ isPaused: v.data });
        if (cmd == "stop") this.props.currentTrackChangeFn(null, "stop");
      });
    });
  }

  render() {
    return (
      <>
        <Col>
          <Card className="mt-3">
            <Card.Header className="d-flex align-items-center">
              <h5 className="d-inline-block m-0">Now Playing...</h5>
              <span className="d-inline-block ml-auto">
                {this.props.currentTracks != undefined &&
                this.props.currentTracks != null &&
                this.props.currentTracks.length > 0 ? (
                  <>
                    {this.state.isPaused ? (
                      <IoMdPlay
                        className="icon-btn mr-1"
                        onClick={() => this.sendControl("play")}
                      />
                    ) : (
                      <IoMdPause
                        className="icon-btn mr-1"
                        onClick={() => this.sendControl("pause")}
                      />
                    )}
                    <IoMdSquare
                      className="icon-btn"
                      onClick={() => this.sendControl("stop")}
                    />
                  </>
                ) : (
                  <></>
                )}
              </span>
            </Card.Header>
            <Card.Body
              className="p-1 d-flex align-items-center flex-row"
              style={{ minHeight: 60 }}
            >
              {this.props.currentTracks != undefined &&
              this.props.currentTracks != null &&
              this.props.currentTracks.length > 0 ? (
                <>
                  <img
                    src={"/" + this.props.currentTracks[0] + ".png"}
                    width="50px"
                    className="m-2"
                    onClick={() => {
                      this.setState({ showModal: true });
                    }}
                  />
                  <h3 className="m-0 p-0 w-100">
                    {this.props.currentTracks[0]}
                  </h3>
                </>
              ) : (
                <></>
              )}
            </Card.Body>
          </Card>
          <Card className="py-2 px-3 mt-4 d-flex align-items-center flex-row">
            <h5 className="m-0 mr-4 p-0">Speed: </h5>
            <span className="w-100">
              <RangeSlider
                value={this.state.speed}
                onChange={(e) => this.setState({ speed: e.target.value })}
                variant="light"
                min={10}
                max={400}
                tooltip="auto"
                tooltipLabel={(currentValue) => `${currentValue}%`}
                inputProps={{
                  onMouseUp: () => {
                    console.log("Set speed to " + this.state.speed);
                    Axios.post("/tracks/setSpeed", { speed: this.state.speed });
                  },
                  onTouchEnd: () => {
                    console.log("Set speed to " + this.state.speed);
                    Axios.post("/tracks/setSpeed", { speed: this.state.speed });
                  },
                }}
              />
            </span>
          </Card>
          <div className="mt-3 mb-2 d-flex align-content-center justify-content-between">
            <h4 className="m-0">Up Next...</h4>
            <Badge
              variant="secondary"
              onClick={() => {
                Axios.post("/tracks/setRepeat", {
                  repeat: !this.state.repeat,
                }).then(() => {
                  this.setState((state, props) => {
                    return { repeat: !state.repeat };
                  });
                });
              }}
            >
              <IoMdRepeat
                className={
                  this.state.repeat ? "text-success" : "text-light"
                }
                size="2em"
              />
            </Badge>
          </div>
          <div className="px-4">
            {this.props.currentTracks.slice(1).map((track) => {
              return (
                <TrackItem
                  name={track}
                  selected={false}
                  onClickedFn={(opt) =>
                    this.props.currentTrackChangeFn(track, opt)
                  }
                />
              );
            })}
          </div>
        </Col>
        <Modal
          show={this.state.showModal}
          size="lg"
          dialogClassName="mh-50"
          centered
          onHide={() => this.setState({ showModal: false })}
        >
          <Modal.Header closeButton>
            <Modal.Title>{this.props.currentTracks[0]}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Image src={"/" + this.props.currentTracks[0] + ".png"} fluid />
          </Modal.Body>
        </Modal>
      </>
    );
  }
}

export default Controls;
