import { FileUploadZone } from "../FileUploadZone";

export default function FileUploadZoneExample() {
  return (
    <div className="p-8 max-w-2xl">
      <FileUploadZone
        onFileUpload={(file) => {
          console.log("File uploaded:", file.name);
        }}
      />
    </div>
  );
}
