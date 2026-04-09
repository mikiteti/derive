import { key } from "../../assets.js";

const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':\",./<>?`~".split("");

const createCommandSet = (editor) => {
    const command = (e) => {
        let keyName = (key.metaKey(e) ? "M+" : "")
            + (key.altKey(e) ? "A+" : "")
            + (key.ctrlKey(e) ? "C+" : "")
            + (key.shiftKey(e) && (abc.indexOf(e.key) == -1 || key.metaKey(e) || key.altKey(e) || key.ctrlKey(e)) ? "S+" : "")
            + e.key;

        return window.state.commands.find(e => e.hotkey == keyName || Array.isArray(e.hotkey) && e.hotkey?.includes(keyName))?.run;
    }

    return command;
}

export { createCommandSet };
