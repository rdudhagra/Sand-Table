import React from "react";
import iro from "@jaames/iro";
import { Col, Card } from "react-bootstrap";
import Axios from "axios";

class Led extends React.Component {
  constructor() {
    super();
    this.colorPickerRef;
    this.brightnessSliderRef;
    this.colorPicker;
    this.onColorChange;
    this.sendCmd = this.sendCmd.bind(this);

    this.modes = ["Off", "Rainbow", "Slow Rainbow", "Color Pulse", "Ambiance"];

    this.colorChanging = false;
    this.brightnessChanging = false;

    this.state = { mode: "" };
  }

  sendCmd(modeString) {
    console.log("Sent cmd: " + modeString);
    Axios.post("/led/set", { cmd: encodeURIComponent(modeString) });
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

    var onColorChange = (color) => {
      if(this.colorChanging) return;
      this.colorChanging = true;
      this.sendCmd(color.hexString);
      this.setState({ mode: color.hexString });
      colorPicker.off("color:change", onColorChange);
      setTimeout(() => {
        colorPicker.on("color:change", onColorChange);
        this.colorChanging = false;
      }, 250);
    };

    colorPicker.on("color:change", onColorChange);

    this.onColorChange = onColorChange;

    var onBrightnessChange = (color) => {
      if(this.brightnessChanging) return;
      this.brightnessChanging = true;
      this.sendCmd("!" + Math.round(color.value * 2.55).toString(16));
      brightnessSlider.off("color:change", onBrightnessChange);
      setTimeout(() => {
        brightnessSlider.on("color:change", onBrightnessChange);
        this.brightnessChanging = false;
      }, 250);
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
        <Col className="px-4 mt-4">
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
