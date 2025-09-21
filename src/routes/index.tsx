import { createFileRoute } from "@tanstack/react-router";
import { Typography, Button, Input, Form, Card, Upload, Progress, Space, Divider, Row, Col, Badge, Avatar } from "antd";
import {
  LinkOutlined,
  SendOutlined,
  CloudUploadOutlined,
  SecurityScanOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  WifiOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import { useFileShare } from "../hooks/useFileShare";
import { useState } from "react";

const { Title, Text, Paragraph } = Typography;

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const {
    myId,
    connectedDevice,
    files,
    sendingFiles,
    generateConnectionId,
    submit,
    sendFile,
    cancelSendingFile,
  } = useFileShare();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleGenerateId = async () => {
    setIsGenerating(true);
    try {
      await generateConnectionId();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setIsConnecting(true);
    try {
      await submit(values);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileUpload = async (info: any) => {
    if (info.fileList.length > 0) {
      const latestFile = info.fileList[info.fileList.length - 1];
      setIsUploading(true);
      try {
        await sendFile(latestFile);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <ThunderboltOutlined className="text-white text-xl" />
              </div>
              <div>
                <Title level={3} className="!text-white !mb-0 !text-2xl font-semibold">
                  FileSync
                </Title>
                <Text className="text-slate-400 text-sm">Secure • Fast • Reliable</Text>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge dot={connectedDevice ? true : false} color={connectedDevice ? "#10b981" : "#64748b"}>
                <Button
                  type="text"
                  icon={<WifiOutlined />}
                  className="text-white border-slate-600 hover:bg-slate-700"
                >
                  {connectedDevice ? 'Connected' : 'Offline'}
                </Button>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="text-center mb-12">
          <Title level={1} className="!text-white !mb-4 !text-5xl font-bold">
            Share Files Instantly
          </Title>
          <Paragraph className="text-slate-400 text-xl max-w-2xl mx-auto !mb-8">
            Connect any two devices with a simple ID. No accounts, no uploads to servers.
            Your files transfer directly between devices with end-to-end encryption.
          </Paragraph>

          <Row gutter={[32, 16]} className="mb-12">
            <Col xs={24} md={8}>
              <div className="text-center p-6">
                <SecurityScanOutlined className="text-4xl text-blue-400 mb-3 block" />
                <Title level={4} className="!text-white !mb-2">End-to-End Encrypted</Title>
                <Text className="text-slate-400">Your files are encrypted during transfer</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-6">
                <ThunderboltOutlined className="text-4xl text-emerald-400 mb-3 block" />
                <Title level={4} className="!text-white !mb-2">Lightning Fast</Title>
                <Text className="text-slate-400">Direct peer-to-peer connection</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-6">
                <GlobalOutlined className="text-4xl text-indigo-400 mb-3 block" />
                <Title level={4} className="!text-white !mb-2">Cross Platform</Title>
                <Text className="text-slate-400">Works on any device with a browser</Text>
              </div>
            </Col>
          </Row>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className="!bg-slate-800/50 !border-slate-700 backdrop-blur-sm !rounded-2xl"
                styles={{ body: { padding: '20px' } }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <LinkOutlined className="text-white text-sm" />
                  </div>
                  <Title level={5} className="!text-white !mb-0">Generate Connection ID</Title>
                </div>

                {!myId ? (
                  <div className="space-y-3">
                    <Button
                      type="primary"
                      onClick={handleGenerateId}
                      // loading={isGenerating}
                      className="w-full !bg-blue-600 !border-none hover:!bg-blue-700"
                    // icon={!isGenerating ? <ThunderboltOutlined /> : undefined}
                    // disabled={isGenerating}
                    >
                      Generate ID
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <div className="flex   flex-col">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircleOutlined className="text-blue-400  text-sm" />
                          <Text className="text-blue-400 font-semibold text-sm">Your ID</Text>
                        </div>
                        <div>
                          <Text className="font-mono font-bold text-blue-400 text-sm">
                            {myId}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            className="!text-blue-400 hover:!bg-blue-400/10"
                            onClick={() => navigator.clipboard.writeText(myId)}
                          />
                        </div>
                      </div>
                    </div>
                    <Text className="text-slate-400 text-xs">Share this ID to receive connections</Text>
                  </div>
                )}
              </Card>

              <Card
                className="!bg-slate-800/50 !border-slate-700 backdrop-blur-sm !rounded-2xl"
                styles={{ body: { padding: '20px' } }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <WifiOutlined className="text-white text-sm" />
                  </div>
                  <Title level={5} className="!text-white !mb-0">Connected Device</Title>
                </div>

                {connectedDevice ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircleOutlined className="text-emerald-400 text-sm" />
                        <Text className="text-emerald-400 font-semibold text-sm">Connected</Text>
                      </div>
                      <Text className="font-mono text-sm text-emerald-400">{connectedDevice}</Text>
                    </div>
                    <Text className="text-slate-400 text-xs">Ready for file transfer</Text>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-center">
                      <Text className="text-slate-500 text-sm">No device connected</Text>
                    </div>
                    <Text className="text-slate-400 text-xs">Connect to start sharing files</Text>
                  </div>
                )}
              </Card>

              <Card
                className="!bg-slate-800/50 !border-slate-700 backdrop-blur-sm !rounded-2xl md:col-span-2"
                styles={{ body: { padding: '20px' } }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <SendOutlined className="text-white text-sm" />
                  </div>
                  <Title level={5} className="!text-white !mb-0">Connect to Device</Title>
                </div>

                <Form layout="inline" onFinish={handleSubmit} className="w-full">
                  <div className="flex w-full space-x-2">
                    <Form.Item
                      name="connectionId"
                      rules={[{ required: true, message: 'Enter ID' }]}
                      className="!mb-0 flex-1"
                    >
                      <Input
                        prefix={<LinkOutlined className="text-slate-400" />}
                        placeholder="Enter device ID"
                        className="!bg-slate-700/50 !border-slate-600 !text-white hover:!border-blue-500 focus:!border-blue-500"
                        style={{ color: 'white' }}

                      />
                    </Form.Item>
                    <Form.Item className="!mb-0">
                      <Button
                        type="primary"
                        htmlType="submit"
                        disabled={!myId}
                        loading={isConnecting}
                        className="!bg-indigo-600 !border-none hover:!bg-indigo-700"
                        icon={!isConnecting ? <SendOutlined /> : undefined}
                      >
                        Connect
                      </Button>
                    </Form.Item>
                  </div>
                </Form>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card
                className="!bg-slate-800/50 !border-slate-700 backdrop-blur-sm !rounded-2xl h-full"
                styles={{ body: { padding: '24px' } }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <CloudUploadOutlined className="text-white text-sm" />
                  </div>
                  <Title level={5} className="!text-white !mb-0">File Transfer</Title>
                </div>

                {connectedDevice ? (
                  <div className="space-y-4">
                    <Upload
                      beforeUpload={() => false}
                      multiple={false}
                      customRequest={() => { }}
                      showUploadList={false}
                      onChange={handleFileUpload}
                    >
                      <Button
                        className="w-full !bg-orange-600 !border-none hover:!bg-orange-700 !text-white"
                        loading={isUploading}
                        icon={!isUploading ? <CloudUploadOutlined /> : undefined}
                      >
                        {isUploading ? 'Uploading...' : 'Select File'}
                      </Button>
                    </Upload>

                    {sendingFiles.length > 0 && (
                      <div className="space-y-2">
                        <Text className="text-white text-sm font-semibold">Sending</Text>
                        {sendingFiles.map(f => (
                          <div key={f.name} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <div className="flex items-center justify-between mb-2">
                              <Text className="text-white text-sm font-medium truncate flex-1 mr-2">{f.name}</Text>
                              {f.status === 'sending' && (
                                <Button
                                  danger
                                  size="small"
                                  type="text"
                                  icon={<CloseCircleOutlined />}
                                  onClick={() => cancelSendingFile(f.name)}
                                  className="!text-red-400 hover:!bg-red-500/20"
                                />
                              )}
                            </div>
                            <Progress
                              percent={f.progress}
                              size="small"
                              status={
                                f.status === 'done' ? "success" :
                                  f.status === 'cancelled' ? "exception" : "active"
                              }
                              strokeColor="#3b82f6"
                              trailColor="rgba(71, 85, 105, 0.3)"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {files.length > 0 && (
                      <div className="space-y-2">
                        <Text className="text-white text-sm font-semibold">Received</Text>
                        {files.map(f => (
                          <div key={f.name} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <div className="flex items-center justify-between mb-2">
                              <Text className="text-white text-sm font-medium truncate flex-1 mr-2">{f.name}</Text>
                              {f.url && f.status === 'done' && (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<DownloadOutlined />}
                                  className="!bg-emerald-600 hover:!bg-emerald-700"
                                >
                                  <a href={f.url} download={f.name} className="text-white no-underline">
                                    Download
                                  </a>
                                </Button>
                              )}
                            </div>
                            <Progress
                              percent={f.progress}
                              size="small"
                              status={
                                f.status === 'done' ? "success" :
                                  f.status === 'cancelled' ? "exception" : "active"
                              }
                              strokeColor="#10b981"
                              trailColor="rgba(71, 85, 105, 0.3)"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <WifiOutlined className="text-4xl text-slate-600 mb-3 block" />
                    <Text className="text-slate-500 text-sm">Connect a device first</Text>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 pt-8 border-t border-slate-700">
          <Text className="text-slate-500">
            FileSync • Secure file sharing without the cloud • Built for privacy
          </Text>
        </div>
      </div>
    </div>
  );
}