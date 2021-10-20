import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import Axios from "axios";
import { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import BootstrapTable from 'react-bootstrap-table-next';

/**
 * Columns for the available files table
 */
const availableFilesColumns = [
    {
        dataField: "filename",
        text: "Filename"
    }
]

/**
 * Columns for the files added to stream table
 */
const addedToStreamColumns = [
    {
        dataField: "id",
        text: "Id"
    },
    {
        dataField: "filename",
        text: "Filename"
    },
    {
        dataField: "from",
        text: "From (seconds)"
    },
    {
        dataField: "to",
        text: "To (seconds)"
    }
]

function MediaClip(filename, from, to) {
    this.filename = filename;
    this.from = from;
    this.to = to;
}


const MediaFilePicker = (props) => {
    const [mediaDuration, setMediaDuration] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [availableMediaFilesData, setAvailableMediaFilesData] = useState([{ filename: "Loading.." }]);
    const [modalFrom, setModalFrom] = useState(null);
    const [modalTo, setModalTo] = useState(null);
    const [mediaAddedToStreamData, setMediaAddedToStreamData] = useState("")

    // similar to componentDidMount
    // as per react documentation, data fetching can be done in useEffect()
    useEffect(() => {
        loadAvailableMediaFilesData();
        updateMediaToStreamData();
    }, []);


    /**
     * Load the available media filenames into the table from the server
     */
    async function loadAvailableMediaFilesData() {
        let isMounted = true;
        const response = await props.loadAvailableMediaFiles();

        if (response.data) {
            const mediaFilesData = []
            response.data.forEach((mediaFile) => {
                mediaFilesData.push({
                    filename: mediaFile
                });
            });

            if (isMounted) setAvailableMediaFilesData(mediaFilesData);
        }
        isMounted = false;
    }

    /**
     * Available media files tables' row events
     */
    const availableMediaFilesRowEvents = {
        onClick: async (e, row, rowIndex) => {
            // set the row information and open up the dialog 
            const mediaFilename = row.filename;
            let duration = await getMediaDuration(mediaFilename);
            setSelectedMedia(mediaFilename);
            setMediaDuration(duration);
            handleShow();
        }
    }

    /**
     * Get the duration of the media file selected
     */
    async function getMediaDuration(filename) {
        // ask the server to get the duration of this file/
        try {
            let data = {
                filename: filename
            }
            const response = await Axios.post(`http://localhost:3000/${props.getMediaDurationRoute}`, data);
            return response.data;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Handle close of the Modal dialog
     */
    function handleClose() {
        setShowModal(false);
    }

    /**
     * Handle show of the Modal dialog
     */
    function handleShow() {
        setShowModal(true);
    }

    /**
     * Handle "Add to stream" button click from modal dialog.
     */
    function handleAddToStream() {
        // do some basic error checking here.. 
        // we can add more complex error checking in the future
        // check if from is less than total video duration
        // check if to is less than total video duration
        // check if to is greater than from
        let error = false;
        let modalFromFloat = parseFloat(modalFrom);
        let modalToFloat = parseFloat(modalTo);
        let mediaDurationFloat = parseFloat(mediaDuration);
        if (modalFromFloat >= mediaDurationFloat) {
            error = true;
            alert("The 'From' duration should be less than the total video duration");
        } else if (modalToFloat > mediaDurationFloat) {
            error = true;
            alert("The 'To' duration should be less than or equal to the total video duration");
        } else if (modalFromFloat >= modalToFloat) {
            error = true;
            alert("The 'From' duration should be less than the 'To' duration");
        } else if (modalFrom == null || modalTo == null) {
            error = true;
            alert("Please enter values into 'From' and 'To' fields");
        }

        if (!error) {
            let mediaClip = new MediaClip(selectedMedia, modalFrom, modalTo);
            props.mediaToStream.push(mediaClip);
            updateMediaToStreamData();
            setShowModal(false);
        }
    }


    function updateMediaToStreamData() {
        const data = [];
        let id = 0;
        props.mediaToStream.forEach((mediaClip) => {
            const mediaData = {
                id: id,
                filename: mediaClip.filename,
                from: mediaClip.from,
                to: mediaClip.to
            }

            id++;

            data.push(mediaData);
        });

        setMediaAddedToStreamData(data);
    }


    /**
     * Handle onChange on the "From" input element in the modal dialog.
     */
    function handleModalFromOnChange(event) {
        setModalFrom(event.target.value);
    }

    /**
     * Handle onChange on the "To" input element in the modal dialog.
     */
    function handleModalToOnChange(event) {
        setModalTo(event.target.value);
    }

    /**
     * Function to clear media added to stream data
     */
    function clearMediaAddedToStream() {
        setMediaAddedToStreamData("");
        while (props.mediaToStream.length !== 0) {
            props.mediaToStream.pop();
        }
    }

    return (
        <div>
            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header>
                    <h3>
                        {selectedMedia}
                    </h3>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Total media duration: {mediaDuration} seconds
                    </p>
                    <label>
                        From (seconds):
                    </label>
                    <input
                        className="modal-input-from"
                        type="number"
                        min="0"
                        max={mediaDuration}
                        onChange={handleModalFromOnChange}>
                    </input>
                    <br></br>
                    <label>
                        To (seconds):
                    </label>
                    <input
                        className="modal-input-to"
                        type="number"
                        min="0"
                        max={mediaDuration}
                        onChange={handleModalToOnChange}></input>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                    <Button variant="primary" onClick={handleAddToStream}>Add to stream</Button>
                </Modal.Footer>
            </Modal>

            <div class="container">
                <div class="row">
                    <div class="col-sm">
                        <h1> {props.tableOneHeading} </h1>
                        <BootstrapTable
                            classes="table-sm"
                            keyField="filename"
                            data={availableMediaFilesData}
                            columns={availableFilesColumns}
                            bootstrap4={true}
                            hover={true}
                            rowEvents={availableMediaFilesRowEvents}
                        />
                    </div>
                    <div class="col-sm">
                        <h1> {props.tableTwoHeading}</h1>
                        <BootstrapTable
                            classes="table-sm"
                            keyField="id"
                            data={mediaAddedToStreamData}
                            columns={addedToStreamColumns}
                            bootstrap4={true}
                        />
                        <div class="text-center">
                            <Button size="sm" variant="outline-primary" onClick={ clearMediaAddedToStream }>{props.clearBtnText}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



export default MediaFilePicker;