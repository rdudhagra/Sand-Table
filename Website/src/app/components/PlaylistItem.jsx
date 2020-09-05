import React from "react";
import {
  Row,
  Image,
  Modal,
  Card,
  ButtonGroup,
  Button,
  Col,
} from "react-bootstrap";
import { IoMdPlay, IoMdTrash, IoMdClose } from "react-icons/io";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { MdEdit } from "react-icons/md";
import Axios from "axios";

class PlaylistItem extends React.Component {
  constructor() {
    super();
    this.state = { showModal: false };
  }

  render() {
    return (
      <>
        <Card
          border={this.props.selected ? "success" : null}
          className="p-1 mt-1 w-100 d-flex align-items-center flex-row"
          onClick={() => {
            this.setState({ showModal: true });
          }}
        >
          <span className="numberCircle ml-2 my-2">
            <span>{this.props.tracks.length}</span>
          </span>
          <h3 className="m-0 p-0 ml-3 w-100 text-truncate">
            {this.props.name}
          </h3>
        </Card>

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
            <IoMdPlay
              size="1.5em"
              className="ml-4 icon-btn"
              onClick={() => {
                this.setState({ showModal: false });
                this.props.currentTrackChangeFn(
                  this.props.tracks,
                  "playPlaylist"
                );
              }}
            />
            <MdEdit
              size="1.5em"
              className="ml-2 icon-btn"
              onClick={() => {
                var newName = prompt(
                  "Enter a new name for this playlist:",
                  this.props.name
                );
                if (newName == null) return;
                Axios.post("/playlists/rename", {
                  playlistName: this.props.name,
                  newName: newName,
                }).then(() => {
                  this.props.updateTracksFn();
                });
              }}
            />
            <IoMdTrash
              size="1.5em"
              className="ml-2 icon-btn"
              onClick={() => {
                this.setState({ showModal: false });
                Axios.post("/playlists/delete", {
                  playlistName: this.props.name,
                }).then(() => {
                  this.props.updateTracksFn();
                });
              }}
            />
          </Modal.Header>
          <Modal.Body style={{ minHeight: 100, maxHeight: "calc(100vh - 17em)", overflowY: "scroll"}}>
            {this.props.tracks.map((track, index) => {
              return (
                <Card
                  className="p-1 mt-1 w-100 d-flex align-items-center flex-row"
                  border="light"
                >
                  <img
                    src={"/" + track + ".png"}
                    width="50px"
                    className="m-2"
                  />
                  <h3 className="m-0 p-0 w-100 text-truncate">{track}</h3>
                  <Col className="align-content-center ml-2 mr-2">
                    <FiChevronUp
                      size="1.2em"
                      className="m-0 p-0 icon-btn"
                      onClick={() => {
                        Axios.post("/playlists/shiftTrackUp", {
                          playlistName: this.props.name,
                          trackIndex: index,
                        }).then(() => {
                          this.props.updateTracksFn();
                        });
                      }}
                    />
                    <IoMdClose
                      className="m-0 p-0 icon-btn"
                      size="1.2em"
                      onClick={() => {
                        Axios.post("/playlists/removeTrack", {
                          playlistName: this.props.name,
                          trackIndex: index,
                        }).then(() => {
                          this.props.updateTracksFn();
                        });
                      }}
                    />
                    <FiChevronDown
                      size="1.2em"
                      className="m-0 p-0 icon-btn"
                      onClick={() => {
                        Axios.post("/playlists/shiftTrackDown", {
                          playlistName: this.props.name,
                          trackIndex: index,
                        }).then(() => {
                          this.props.updateTracksFn();
                        });
                      }}
                    />
                  </Col>
                </Card>
              );
            })}
          </Modal.Body>
        </Modal>
      </>
    );
  }
}

export default PlaylistItem;
