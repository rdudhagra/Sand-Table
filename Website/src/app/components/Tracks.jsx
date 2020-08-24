import React from "react";
import { Col, Navbar, Spinner, Tabs, Tab, Button } from "react-bootstrap";
import { IoMdCloudUpload, IoIosCreate } from "react-icons/io";

import Axios from "axios";
import TrackItem from "./TrackItem.jsx";
import { MdPlaylistAddCheck } from "react-icons/md";
import PlaylistItem from "./PlaylistItem.jsx";

class Tracks extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <Tabs className="mt-3" justify variant="pills" defaultActiveKey="tracks">
        <Tab eventKey="tracks" title="Tracks" tabClassName="btn-outline-light">
          <Col
            className="mt-2"
            style={{ height: "calc(100% - 17em)", overflow: "scroll" }}
          >
            {this.props.tracks.map((name) => (
              <TrackItem
                name={name}
                selected={
                  this.props.currentTracks.length > 0 &&
                  this.props.currentTracks[0] == name
                }
                onClickedFn={this.props.currentTrackChangeFn}
              />
            ))}
          </Col>
          <Navbar fixed="bottom" bg="dark">
            <label
              className="mx-auto mb-2 btn btn-outline-success d-flex align-items-center justify-content-center"
              style={{ width: "15em", height: "2.5em" }}
            >
              {this.props.loading ? (
                <Spinner
                  animation="border"
                  role="status"
                  variant="light"
                  size="sm"
                />
              ) : (
                <>
                  <IoMdCloudUpload />
                  <span className="pl-2">Upload a new track</span>
                  <input
                    type="file"
                    accept=".thr"
                    onChange={(e) => this.props.uploadNew(e)}
                    hidden
                  />
                </>
              )}
            </label>
          </Navbar>
        </Tab>
        <Tab
          eventKey="playlists"
          title="Playlists"
          tabClassName="btn-outline-light"
        >
          <Col
            className="mt-2"
            style={{ height: "calc(100% - 17em)", overflow: "scroll" }}
          >
            {Object.entries(this.props.playlists).map(([name, tracks]) => (
              <PlaylistItem
                name={name}
                tracks={tracks}
                selected={false}
                onClickedFn={() => {}}
                updateTracksFn={this.props.updatePlaylists}
                currentTrackChangeFn={this.props.currentTrackChangeFn}
              />
            ))}
          </Col>
          <Navbar fixed="bottom" bg="dark">
            <Button
              variant="outline-success"
              className="mx-auto mb-2 d-flex align-items-center justify-content-center"
              style={{ width: "15em", height: "2.5em" }}
              onClick={() => {
                var newName = prompt("Enter a name for this playlist:", "");
                if (newName == null || newName == "") return;
                Axios.post("/playlists/new", {
                  name: newName,
                }).then(() => {
                  this.props.updatePlaylists();
                });
              }}
            >
              <IoIosCreate />
              <span className="pl-2">Create a new playlist</span>
            </Button>
          </Navbar>
        </Tab>
      </Tabs>
    );
  }
}

export default Tracks;
