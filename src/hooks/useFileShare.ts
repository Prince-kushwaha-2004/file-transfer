import { useState, useRef } from "react";
import Peer, { DataConnection } from "peerjs";
import toast from "react-hot-toast";

type FileStatus = 'receiving' | 'done' | 'cancelled' | 'sending';
type FileEntry = { name: string, url: string | null, progress: number, status: FileStatus };

type FileChunkData = {
    chunk: BlobPart;
    isLast: boolean;
    mimeType?: string;
    fileName?: string;
    progress?: number;
    type?: string;
};

export function useFileShare() {
    const [myId, setMyId] = useState("");
    const [connectedDevice, setConnectedDevice] = useState("");
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [sendingFiles, setSendingFiles] = useState<FileEntry[]>([]);

    const peerRef = useRef<Peer | null>(null);
    const connectionRef = useRef<DataConnection | null>(null);
    const fileChunksRef = useRef<Record<string, BlobPart[]>>({});
    const activeTransfersRef = useRef<Record<string, { cancelled: boolean }>>({});

    const generateConnectionId = () => {
        if (!peerRef.current) {
            const peer = new Peer();
            peer.on("open", (id) => setMyId(id));
            peer.on("connection", (conn) => {
                connectionRef.current = conn;
                conn.on("open", () => {
                    setConnectedDevice(conn.peer);
                    conn.on("data", acceptFile);
                });
            });
            peerRef.current = peer;
        } else {
            toast.error("Id already Generated");
        }
    };

    const submit = (values: { connectionId: string }) => {
        if (peerRef.current) {
            let conn = connectionRef.current;
            if (!conn || conn.open === false) {
                try {
                    conn = peerRef.current.connect(values.connectionId);
                    connectionRef.current = conn;
                    conn.on("open", () => {
                        if (conn) {
                            setConnectedDevice(conn.peer);
                            conn.on("data", acceptFile);
                        }
                    });
                } catch (error) {
                    console.error("Failed to connect:", error);
                }
            } else {
                toast.error("Already connected.");
            }
        } else {
            toast.error("Peer not initialized.");
        }
    };

    const sendFile = (fileObj: any) => {
        if (!connectionRef.current || !connectionRef.current.open) {
            toast.error("No device connected.");
            return;
        }
        const selectedFile = fileObj.originFileObj;
        if (!selectedFile) return;

        const chunkSize = 1024 * 1024;
        const reader = new FileReader();
        let offset = 0;

        setSendingFiles((prev) => {
            const exists = prev.find((f) => f.name === selectedFile.name);
            if (exists) {
                return prev.map((f) =>
                    f.name === selectedFile.name ? { ...f, progress: 0, status: "sending" } : f
                );
            } else {
                return [
                    ...prev,
                    { name: selectedFile.name, url: null, progress: 0, status: "sending" }
                ];
            }
        });

        reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (!arrayBuffer) return;

            const totalSize = selectedFile.size;
            const mimeType = selectedFile.type;
            const fileName = selectedFile.name;

            activeTransfersRef.current[fileName] = { cancelled: false };

            function sendChunk() {
                if (activeTransfersRef.current[fileName]?.cancelled) return;

                const end = Math.min(offset + chunkSize, totalSize);
                const chunk = arrayBuffer.slice(offset, end);
                const isLast = end >= totalSize;

                const progress = Math.round((end / totalSize) * 100);

                connectionRef.current?.send({
                    chunk,
                    isLast,
                    mimeType,
                    fileName,
                    progress,
                });
                console.log("sendingfile", progress)

                offset = end;

                setSendingFiles((prev) =>
                    prev.map((f) => (f.name === fileName ? { ...f, progress } : f))
                );

                if (!isLast) {
                    setTimeout(sendChunk, 0);
                } else {
                    setSendingFiles((prev) =>
                        prev.map((f) =>
                            f.name === fileName ? { ...f, progress: 100, status: "done" } : f
                        )
                    );
                    delete activeTransfersRef.current[fileName];
                    toast.success(`${fileName} sent!`);
                }
            }

            sendChunk();
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    const cancelSendingFile = (fileName: string) => {
        if (activeTransfersRef.current[fileName]) {
            activeTransfersRef.current[fileName].cancelled = true;
            connectionRef.current?.send({ type: "cancel", fileName });
            setSendingFiles((prev) =>
                prev.map((f) => (f.name === fileName ? { ...f, status: "cancelled" } : f))
            );
            toast.error(`${fileName} cancelled!`);
        }
    };

    const acceptFile = (data: unknown) => {
        const fileData = data as FileChunkData;

        if (fileData?.type === "cancel") {
            const { fileName } = fileData;
            if (fileName) {
                delete fileChunksRef.current[fileName];
                setFiles((prev) =>
                    prev.map((f) => (f.name === fileName ? { ...f, status: "cancelled" } : f))
                );
                toast.error(`${fileName} transfer cancelled by sender.`);
            }
            return;
        }

        if (typeof data === "object" && data !== null && "chunk" in data && "isLast" in data) {
            const { fileName = "download", mimeType = "application/octet-stream", progress = 0 } = fileData;

            if (!fileChunksRef.current[fileName]) {
                fileChunksRef.current[fileName] = [];
                setFiles((prev) => {
                    const exists = prev.find((f) => f.name === fileName);
                    if (exists) {
                        return prev.map((f) =>
                            f.name === fileName ? { ...f, url: null, progress: 0, status: "receiving" } : f
                        );
                    } else {
                        return [...prev, { name: fileName, url: null, progress: 0, status: "receiving" }];
                    }
                });
            }

            fileChunksRef.current[fileName].push(fileData.chunk);
            console.log("recievefile", progress)
            setFiles((prev) =>
                prev.map((f) =>
                    f.name === fileName
                        ? {
                            ...f,

                            progress: fileData.isLast ? 100 : progress,
                            status: fileData.isLast ? "done" : "receiving",
                        }
                        : f
                )
            );

            if (fileData.isLast) {
                const blob = new Blob(fileChunksRef.current[fileName], { type: mimeType });
                const url = URL.createObjectURL(blob);

                setFiles((prev) =>
                    prev.map((f) =>
                        f.name === fileName ? { ...f, url, progress: 100, status: "done" } : f
                    )
                );

                fileChunksRef.current[fileName] = [];
                toast.success(`${fileName} received.`);
            }
        } else {
            toast.error("Not a File.");
        }
    };

    return {
        myId,
        connectedDevice,
        files,
        sendingFiles,
        generateConnectionId,
        submit,
        sendFile,
        cancelSendingFile,
    };
}
