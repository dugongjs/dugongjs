import { Command } from "commander";
import { withFullScreen } from "fullscreen-ink";
import React from "react";
import { MainView } from "../studio/main-view.jsx";

const studio = new Command("studio").description("Launch the interactive studio").action(() => {
    withFullScreen(<MainView />).start();
});

export default studio;
