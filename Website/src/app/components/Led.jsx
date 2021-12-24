import React from "react";
import iro from "@jaames/iro";
import { Col, Card } from "react-bootstrap";
import RangeSlider from "react-bootstrap-range-slider";
import Axios from "axios";

class Led extends React.Component {
  constructor() {
    super();
    this.colorPickerRef;
    this.brightnessSliderRef;
    this.colorPicker;
    this.onColorChange;
    this.sendCmd = this.sendCmd.bind(this);

    this.modes = ["Off", "Rainbow", "Christmas", "Color Pulse", "Ambiance", "Confetti"];

    this.colorChanging = false;
    this.brightnessChanging = false;

    this.state = { mode: "", speed: 25 };
  }

  async sendCmd(modeString) {
    console.log("Sent cmd: " + modeString);
    await Axios.post("/led/set", { cmd: encodeURIComponent(modeString) });
  }

  componentDidMount() {
    var colorPicker = new iro.ColorPicker(this.colorPickerRef, {
      // Set the size of the color picker
      width: 275,
      // Set the initial color to pure white
      color: "#fff",
      display: "inline-block",
      layout: [
        {
          component: iro.ui.Wheel,
        },
      ],
    });
    var brightnessSlider = new iro.ColorPicker(this.brightnessSliderRef, {
      // Set the size of the color picker
      width: 275,
      // Set the initial color to pure white
      color: "#fff",
      display: "inline-block",
      layout: [
        {
          component: iro.ui.Slider,
        },
      ],
    });

    var onColorChange = async (color) => {
      if (this.colorChanging) return;
      this.colorChanging = true;
      colorPicker.off("color:change", onColorChange);
      this.setState({ mode: color.hexString });
      await this.sendCmd(color.hexString);
      colorPicker.on("color:change", onColorChange);
      this.colorChanging = false;
    };

    colorPicker.on("color:change", onColorChange);

    this.onColorChange = onColorChange;

    var onBrightnessChange = async (color) => {
      if (this.brightnessChanging) return;
      this.brightnessChanging = true;
      brightnessSlider.off("color:change", onBrightnessChange);
      await this.sendCmd("!" + Math.round(color.value * 2.55).toString(16));
      brightnessSlider.on("color:change", onBrightnessChange);
      this.brightnessChanging = false;
    };

    brightnessSlider.on("color:change", onBrightnessChange);

    Axios.get("/led/get").then((v) => {
      this.setState({ mode: v.data });
      if (v.data.toString().startsWith("#")) colorPicker.color.set(v.data);
    });

    this.colorPicker = colorPicker;
  }

  render() {
    return (
      <>
        <Col
          className="mt-4 text-center"
          ref={(ref) => (this.colorPickerRef = ref)}
        />
        <Col
          className="mt-3 text-center"
          ref={(ref) => (this.brightnessSliderRef = ref)}
        />
        <Col className="mt-3 px-5 text-center d-flex align-items-center flex-row">
          <h5 className="m-0 mr-4 p-0">Speed: </h5>
          <span className="w-100">
            <RangeSlider
              value={this.state.speed}
              onChange={(e) => this.setState({ speed: e.target.value })}
              variant="light"
              min={1}
              max={100}
              tooltip="auto"
              tooltipLabel={(currentValue) => `${currentValue}`}
              inputProps={{
                onMouseUp: () => {
                  console.log("Set led speed to " + this.state.speed);
                  this.sendCmd("@" + Math.round(this.state.speed).toString(16));
                },
                onTouchEnd: () => {
                  console.log("Set led speed to " + this.state.speed);
                  this.sendCmd("@" + Math.round(this.state.speed).toString(16));
                },
              }}
            />
          </span>
        </Col>
        <Col className="px-4 mt-4 pb-5">
          {this.modes.map((name, index) => {
            return (
              <Card
                border={this.state.mode == "" + index ? "success" : null}
                onClick={() => {
                  this.sendCmd(String.fromCharCode(index));
                  this.colorPicker.off("color:change", this.onColorChange);
                  this.colorPicker.color.set("#fff");
                  this.colorPicker.on("color:change", this.onColorChange);
                  this.setState({ mode: "" + index });
                }}
                className="py-2 px-3 mt-2 d-flex align-items-center flex-row"
              >
                <h5 className="m-0 p-0 w-100 text-center">{name}</h5>
              </Card>
            );
          })}
        </Col>
      </>
    );
  }
}

export default Led;
