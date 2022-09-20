import React, { useState } from "react";
import { faFileUpload, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Button, Form, Modal, ProgressBar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { storage } from "../../API/firebase";
import { addFileUser } from "../../redux/actionCreators/filefoldersActionCreators";

const UploadImage = ({ currentFolder }) => {
  const [showModal, setShowModal] = useState(false);
  const [Image, setImage] = useState(null);
  const [ImageName, setImageName] = useState("");
  const [progress, setProgress] = useState(0);

  const dispatch = useDispatch();
  const { userId, userImages } = useSelector(
    (state) => ({
      userId: state.auth.userId,
      userFiles: state.Imagefolders.userImages,
    }),
    shallowEqual
  );

  const handleImageSubmit = (e) => {
    e.preventDefault();
    if (!Image) return toast.dark("Please add image name!");
    const ImageExtension = Image.name.split(".").reverse()[0];
    const allowedExtensions = [
     
     
      "png",
      "jpg",
      "jpeg",
      "gif",
      "svg",
      // "mp3",
      // "mp4",
      // "webm",
      // "pdf",
    ];

    if (allowedExtensions.indexOf(ImageExtension) === -1) {
      return toast.dark(`File with extension ${ImageExtension} not allowed!`);
    }
    const filteredImages =
      currentFolder === "root folder"
        ? userImages.filter(
            (Image) =>
            Image.data.parent === "" &&
            Image.data.name === ImageName.split("\\").reverse()[0]
          )
        : userImages.filter(
            (Image) =>
            Image.data.parent === currentFolder.docId &&
            Image.data.name === ImageName.split("\\").reverse()[0]
          );
    if (filteredImages.length > 0)
      return toast.dark("This is alredy present in folder");

    const uploadImageRef = storage.ref(`Images/${userId}/${Image.name}`);

    uploadImageRef.put(Image).on(
      "state_change",
      (snapshot) => {
        const newProgress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(newProgress);
      },
      (error) => {
        return toast.error(error.message);
      },
      async () => {
        const url = await uploadImageRef.getDownloadURL();
        if (currentFolder === "root folder") {
          dispatch(
            addFileUser({
              uid: userId,
              parent: "",
              data: "",
              name: Image.name,
              url: url,
              path: [],
            })
          );
          setImage("");
          setProgress(0);
          setShowModal(false);
          return;
        }

        const path =
          currentFolder.data.path.length > 0
            ? [
                ...currentFolder.data.path,
                { id: currentFolder.docId, name: currentFolder.data.name },
              ]
            : [{ id: currentFolder.docId, name: currentFolder.data.name }];

        dispatch(
          addFileUser({
            uid: userId,
            parent: currentFolder.docId,
            data: "",
            name: Image.name,
            url: url,
            path: path,
          })
        );
        setImage("");
        setProgress(0);
        setShowModal(false);
        return;
      }
    );
  };

  return (
    <>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header>
          <Modal.Title>
            {progress && progress !== 100
              ? "Uploading..."
              : progress === 100
              ? "Uploaded"
              : "Upload Image"}
          </Modal.Title>
          <Button
            variant="white"
            style={{ cursor: "pointer" }}
            onClick={() => setShowModal(false)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </Modal.Header>
        <Modal.Body>
          {progress && progress !== 100 ? (
            <ProgressBar now={progress} label={`${progress}%`} />
          ) : progress === 100 ? (
            <h1>Image Uploaded Successfully</h1>
          ) : (
            <Form onSubmit={handleImageSubmit} encType="multipart/form-data">
              <Form.Group controlId="formBasicFolderName" className="my-2">
                <input
                  type="file"
                  className="file"
                  onChange={(e) => {
                    
                    setImageName(e.target.value);
                    setImage(e.target.Images[0]);
                  }}
                  custom="true"
                />
              </Form.Group>
              <Form.Group controlId="formBasicFolderSubmit" className="mt-5">
                <Button
                  type="submit"
                  className="form-control"
                  variant="primary"
                >
                  Upload Image
                </Button>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
      </Modal>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline-dark"
        className="border-1 d-flex align-items-center justify-content-between rounded-2"
      >
        <FontAwesomeIcon icon={faFileUpload} />
        &nbsp; Upload Image
      </Button>
    </>
  );
};

export default UploadImage;
