import React from "react";
import useBuilderStore from "../store/builderStore";
import { createFontFace } from "../utils/fontManager";

export default function FontUploader() {

    const addCustomFont =
        useBuilderStore(
            state => state.addCustomFont
        );

    const uploadFont = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const fontName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/\s/g, "");

        const url = URL.createObjectURL(file);

        const extension = file.name.split(".").pop();

        const font = {
            name: fontName,
            url: url,
            format: extension
        };

        createFontFace(font);

        addCustomFont(font);

    };

    return (

        <div>

            <label>
                Upload Custom Font
            </label>

            <input
                type="file"
                accept=".ttf,.woff,.woff2,.otf"
                onChange={uploadFont}
            />

        </div>

    );

}