import "regenerator-runtime/runtime.js";

import React from "react";
import { render } from "react-dom";
import { Container, Tabs, Tab, Modal, Card } from "react-bootstrap";

import "./../scss/main.scss";

import { IoMdPower, IoMdList, IoMdBulb } from "react-icons/io";
import Controls from "./components/Controls.jsx";
import Tracks from "./components/Tracks.jsx";
import Led from "./components/Led.jsx";
import Axios from "axios";

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      currentTracks: [],
      tracks: [],
      loading: false,
      playlists: {},
      showPlaylistSelector: false,
      trackToAdd: "",
    };
    this.onTrackClickedFn = this.onTrackClickedFn.bind(this);
    this.uploadNew = this.uploadNew.bind(this);
    this.updatePlaylists = this.updatePlaylists.bind(this);

    this.tracksComponent = null;
  }

  updateInterval;

  componentDidMount() {
    this.updatePlaylists();
    Axios.get("/tracks/list").then((v) => {
      this.setState({ tracks: v.data });
    });
    Axios.get("/tracks/current").then((v) => {
      if (JSON.stringify(v.data) != JSON.stringify(this.state.currentTracks))
        this.setState({ currentTracks: v.data });
    });
    this.updateInterval = setInterval(() => {
      Axios.get("/tracks/current").then((v) => {
        if (JSON.stringify(v.data) != JSON.stringify(this.state.currentTracks))
          this.setState({ currentTracks: v.data });
      });
    }, 2000); // Update playlist every second
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
  }

  componentDidUpdate(oldProps, oldState) {
    if (
      JSON.stringify(this.state.currentTracks) !=
      JSON.stringify(oldState.currentTracks)
    )
      Axios.post("/tracks/setCurrent", { tracks: this.state.currentTracks });
  }

  updatePlaylists() {
    Axios.get("/playlists/list").then((v) => {
      this.setState({ playlists: v.data });
    });
  }

  onTrackClickedFn(trackName, mode) {
    console.log(trackName);
    switch (mode) {
      case "addToPlaylist":
        this.setState({ trackToAdd: trackName, showPlaylistSelector: true });
        break;
      case "delete":
        Axios.post("/file-upload/delete", { filename: trackName }).then(() => {
          this.setState((state, props) => {
            for (let [playlist, tracks] of Object.entries(state.playlists)) {
              state.playlists[playlist] = tracks.filter((t) => t != trackName);
            }
            return {
              tracks: state.tracks.filter((x) => x != trackName),
              currentTracks: state.currentTracks.filter((x) => x != trackName),
              playlists: state.playlists,
            };
          });
        });
        break;
      case "rename":
        var newName = prompt("Enter a new name for this track:", trackName);
        if (newName == null) return;
        Axios.post("/file-upload/rename", {
          filename: trackName,
          newName: newName,
        }).then(() => {
          this.setState((state, props) => {
            for (let [playlist, tracks] of Object.entries(state.playlists)) {
              state.playlists[playlist] = tracks.map((t) =>
                t == trackName ? newName : t
              );
            }
            return {
              tracks: state.tracks.map((x) => (x == trackName ? newName : x)),
              currentTracks: state.currentTracks.map((x) =>
                x == trackName ? newName : x
              ),
              playlists: state.playlists,
            };
          });
        });
        break;
      case "queue":
        this.setState((state, props) => {
          return {
            currentTracks: [...state.currentTracks, trackName],
          };
        });
        break;
      case "stop":
        this.setState((state, props) => {
          return {
            currentTracks: [],
          };
        });
        break;
      case "play":
        this.setState((state, props) => {
          return {
            currentTracks: [trackName],
          };
        });
        break;
      case "playPlaylist":
        this.setState((state, props) => {
          return {
            currentTracks: trackName, // In this case, trackName is a list of tracks
          };
        });
        break;
    }
  }

  async uploadNew(e) {
    const url = "/file-upload";
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    const config = {
      headers: {
        "content-type": "multipart/form-data",
      },
      timeout: 30 * 60 * 1000,
    };
    this.setState({ loading: true });
    Axios.post(url, formData, config)
      .then(() => {
        Axios.get("/tracks/list").then((v) => {
          this.setState({ tracks: v.data, loading: false });
        });
      })
      .catch((err) => {
        this.setState({ loading: false });
        alert(err);
      });
  }

  render() {
    return (
      <>
        <Container className="h-100">
          <h1 className="text-center m-0 mb-2">Sand Table</h1>
          <Tabs fill defaultActiveKey="controls">
            <Tab eventKey="controls" title={<IoMdPower size="1.5em" />}>
              <Controls
                currentTrackChangeFn={this.onTrackClickedFn}
                currentTracks={this.state.currentTracks}
              />
            </Tab>
            <Tab eventKey="tracks" title={<IoMdList size="1.5em" />}>
              <Tracks
                currentTrackChangeFn={this.onTrackClickedFn}
                currentTracks={this.state.currentTracks}
                tracks={this.state.tracks}
                uploadNew={this.uploadNew}
                loading={this.state.loading}
                playlists={this.state.playlists}
                updatePlaylists={this.updatePlaylists}
              />
            </Tab>
            <Tab eventKey="lights" title={<IoMdBulb size="1.5em" />}>
              <Led />
            </Tab>
          </Tabs>
        </Container>
        <Modal
          show={this.state.showPlaylistSelector}
          size="lg"
          centered
          onHide={() => this.setState({ showPlaylistSelector: false })}
        >
          <Modal.Header
            closeButton
            className="d-flex align-items-center justify-content-between"
          >
            <Modal.Title className="text-truncate w-100">
              Select a playlist:
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{ overflow: "scroll", maxHeight: "calc(100vh - 300px)" }}
          >
            {Object.entries(this.state.playlists).map(([name, tracks]) => (
              <Card
                className="p-1 mt-1 w-100 d-flex align-items-center flex-row"
                border="light"
                onClick={() => {
                  this.setState({ showPlaylistSelector: false });
                  Axios.post("/playlists/addTrack", {
                    playlistName: name,
                    trackName: this.state.trackToAdd,
                  }).then(() => {
                    this.updatePlaylists();
                  });
                }}
              >
                <span className="numberCircle ml-2 my-2">
                  <span>{tracks.length}</span>
                </span>
                <h3 className="m-0 p-0 ml-3 w-100 text-truncate">{name}</h3>
              </Card>
            ))}
          </Modal.Body>
        </Modal>
      </>
    );
  }
}

render(<App />, document.getElementById("app"));
