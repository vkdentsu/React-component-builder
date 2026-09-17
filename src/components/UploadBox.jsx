import { useRef } from "react";
import fileImage from "../assets/file.png";

function UploadBox({ title, file, setFile }) {
    const inputRef = useRef(null);
    const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
        setFile(selectedFile);
    };

    const handleBrowse = () => {
        inputRef.current.click();
    };
    const handleRemove = () => {
        setFile(null);
        inputRef.current.value = "";
    };
    const uploadBoxStyle = {

    };
    const buttonStyle = {
        width: "280px",
        fontSize: "22px",
        fontWeight: "600",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        color: "white",
    };

    return (
    <div>
        <h4
            style={{
                fontSize: "20px",
                marginBottom: "8px",
                marginLeft: "2px",
            }}
        >
            {title}
        </h4>
        <div 
            style={{
                width: "350px",
                minHeight: "200px",
                background: "#fff",
                border: "2px dashed #cbd5e1",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                padding: "20px",
            }}
        >
            {!file ? (
                <>
                <img 
                    src={fileImage}
                    alt="file"
                    style={{
                        height: "86px",
                        marginBottom: "18px",
                    }}
                />
                <button
                    onClick={handleBrowse}
                    style={{
                        ...buttonStyle,
                        backgroundColor: "#2563eb",
                        height: "58px",
                        marginBottom: "18px",
                    }}
                >
                    Browse File
                </button>
                <p
                    style={{
                        fontSize: "14px",
                        marginBottom: "0",
                    }}
                >
                    Upload in PNG / JPG / JPEG format
                </p>
                </>
            ) : (
          <>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              style={{
                height: "140px",
                objectFit: "contain",
                marginBottom: "18px",
              }}
            />
            <h4
              style={{
                marginBottom: "4px",
              }}
            >
                {file.name}
            </h4>
            <p>{(file.size / 1024).toFixed(2)} KB</p>
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={handleBrowse}
                style={{
                    ...buttonStyle,
                    background: "#d7d7d7",
                    width: "120px",
                    color: "#080808",
                    padding: "4px 8px",
                    borderRadius: "10px",
                }}
              >
                Replace
              </button>

              <button
                onClick={handleRemove}
                style={{
                    ...buttonStyle,
                    background: "#dc2626",
                    width: "120px",
                    padding: "4px 8px",
                    borderRadius: "10px",
                }}
              >
                Remove
              </button>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          hidden
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default UploadBox;
