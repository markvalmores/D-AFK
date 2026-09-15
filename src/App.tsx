/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  FileCode,
  FolderOpen,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Info,
  Copy,
  Check,
  AlertCircle,
  HardDrive,
  Sliders,
  Terminal,
} from 'lucide-react';

interface ExecutableState {
  file: File | null;
  name: string;
  size: number;
  lastModified: number;
  browserReportedPath: string;
  customWorkingDir: string;
  status: 'idle' | 'ready' | 'prepared';
}

interface EngineConfig {
  executionMode: 'simulation' | 'controlled' | 'benchmark';
  pollingIntervalMs: number;
  profileName: string;
  telemetryLogging: boolean;
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const [executableState, setExecutableState] = useState<ExecutableState>({
    file: null,
    name: '',
    size: 0,
    lastModified: 0,
    browserReportedPath: '',
    customWorkingDir: '',
    status: 'idle',
  });

  const [engineConfig, setEngineConfig] = useState<EngineConfig>({
    executionMode: 'simulation',
    pollingIntervalMs: 50,
    profileName: 'Standard Profile',
    telemetryLogging: true,
  });

  const handleFileSelect = (selectedFile: File) => {
    // Derive inferred directory from relative path or standard structure
    const relativePath = (selectedFile as any).webkitRelativePath || selectedFile.name;
    const inferredFolder = relativePath.includes('/')
      ? relativePath.substring(0, relativePath.lastIndexOf('/'))
      : `C:\\Games\\${selectedFile.name.replace(/\.exe$/i, '')}`;

    setExecutableState({
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      lastModified: selectedFile.lastModified,
      browserReportedPath: selectedFile.name,
      customWorkingDir: inferredFolder,
      status: 'ready',
    });
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      handleFileSelect(droppedFile);
    }
  };

  const handlePrepareEngine = () => {
    if (!executableState.name) return;
    setExecutableState((prev) => ({
      ...prev,
      status: 'prepared',
    }));
  };

  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setExecutableState({
      file: null,
      name: '',
      size: 0,
      lastModified: 0,
      browserReportedPath: '',
      customWorkingDir: '',
      status: 'idle',
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fullResolvedPath = executableState.customWorkingDir
    ? `${executableState.customWorkingDir.replace(/[\\/]$/, '')}\\${executableState.name}`
    : executableState.name;

  const enginePayload = {
    targetExecutable: executableState.name,
    workingDirectory: executableState.customWorkingDir,
    resolvedFullPath: fullResolvedPath,
    fileSizeBytes: executableState.size,
    lastModifiedEpoch: executableState.lastModified,
    stateStatus: executableState.status,
    configuration: engineConfig,
    timestamp: new Date().toISOString(),
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(enginePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Executable File Selector
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                  State Preparer
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Inspect local executable metadata and configure runner state
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                executableState.status === 'prepared'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : executableState.status === 'ready'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  executableState.status === 'prepared'
                    ? 'bg-emerald-400 animate-pulse'
                    : executableState.status === 'ready'
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
              {executableState.status === 'prepared'
                ? 'State Prepared'
                : executableState.status === 'ready'
                ? 'Executable Loaded'
                : 'Awaiting File'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto p-6 space-y-6 flex-1">
        {/* Security / Sandboxing Notice */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">Browser Security Sandbox Notice: </span>
            Standard HTML5 web applications cannot inspect arbitrary host drive directories directly due to browser privacy constraints. Selecting a file provides file name, size, and binary handles. You can verify the detected name and confirm or adjust the host working directory below.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: File Selector & Path Inspector */}
          <div className="lg:col-span-7 space-y-6">
            {/* File Input Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Select Executable File (.exe)
                </div>
                {executableState.name && (
                  <button
                    id="btn-reset-file"
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                id="exe-file-input"
                type="file"
                accept=".exe,application/x-msdownload"
                onChange={onFileInputChange}
                className="hidden"
              />

              {/* Dropzone */}
              <div
                id="dropzone-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : executableState.name
                    ? 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                    : 'border-slate-800 bg-slate-950/20 hover:border-cyan-500/40 hover:bg-cyan-500/5'
                }`}
              >
                <div className="p-3 rounded-full bg-slate-800/80 text-cyan-400 mb-3 border border-slate-700/80">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200 mb-1">
                  {executableState.name ? (
                    <span className="text-cyan-300 font-semibold">{executableState.name}</span>
                  ) : (
                    'Click to browse or drop an .exe file here'
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  Supports Windows Executables (.exe)
                </p>
              </div>

              {/* Path & Folder Details */}
              {executableState.name ? (
                <div className="space-y-4 pt-2 border-t border-slate-800/70">
                  <div>
                    <label
                      htmlFor="custom-working-dir-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between"
                    >
                      <span>Detected Host Folder / Directory</span>
                      <span className="text-[11px] text-cyan-400 font-normal">Editable Path</span>
                    </label>
                    <div className="relative">
                      <input
                        id="custom-working-dir-input"
                        type="text"
                        value={executableState.customWorkingDir}
                        onChange={(e) =>
                          setExecutableState((prev) => ({
                            ...prev,
                            customWorkingDir: e.target.value,
                          }))
                        }
                        placeholder="e.g. C:\Games\ExampleGame"
                        className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Full Executable Target Path
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 truncate select-all">
                      {fullResolvedPath}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Size</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {formatBytes(executableState.size)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Last Modified</span>
                      <span className="text-slate-200 font-mono font-medium text-[11px]">
                        {executableState.lastModified
                          ? new Date(executableState.lastModified).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block text-[11px]">Type</span>
                      <span className="text-cyan-400 font-mono font-medium">Win32 / PE</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-950/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No file loaded. Select an executable to populate path and state values.
                </div>
              )}
            </div>

            {/* Automation Parameters Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Automation Engine Parameters
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label htmlFor="select-mode" className="block text-slate-400 mb-1 font-medium">
                    Execution Mode
                  </label>
                  <select
                    id="select-mode"
                    value={engineConfig.executionMode}
                    onChange={(e) =>
                      setEngineConfig((prev) => ({
                        ...prev,
                        executionMode: e.target.value as EngineConfig['executionMode'],
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="simulation">Simulation (Safe Sandbox)</option>
                    <option value="controlled">Controlled Testbed</option>
                    <option value="benchmark">Benchmark Analysis</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="input-polling" className="block text-slate-400 mb-1 font-medium">
                    Polling Interval ({engineConfig.pollingIntervalMs}ms)
                  </label>
                  <input
                    id="input-polling"
                    type="range"
                    min="10"
                    max="250"
                    step="10"
                    value={engineConfig.pollingIntervalMs}
                    onChange={(e) =>
                      setEngineConfig((prev) => ({
                        ...prev,
                        pollingIntervalMs: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer mt-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    id="chk-telemetry"
                    type="checkbox"
                    checked={engineConfig.telemetryLogging}
                    onChange={(e) =>
                      setEngineConfig((prev) => ({
                        ...prev,
                        telemetryLogging: e.target.checked,
                      }))
                    }
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                  Enable State Telemetry Logging
                </label>

                <button
                  id="btn-prepare-state"
                  disabled={!executableState.name}
                  onClick={handlePrepareEngine}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    executableState.name
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm shadow-cyan-500/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {executableState.status === 'prepared' ? 'Update State' : 'Prepare Engine State'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Engine State Manifest & Payloads */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live State Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Engine State Payload
                </div>
                <button
                  id="btn-copy-payload"
                  onClick={handleCopyPayload}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre
                  id="state-json-viewer"
                  className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed select-all"
                >
                  {JSON.stringify(enginePayload, null, 2)}
                </pre>
              </div>

              {/* Status summary */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Target Process:</span>
                  <span className="text-slate-200 font-mono">
                    {executableState.name || 'None'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Working Directory:</span>
                  <span className="text-slate-200 font-mono truncate max-w-[180px]">
                    {executableState.customWorkingDir || 'None'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Engine Readiness:</span>
                  <span
                    className={`font-semibold ${
                      executableState.status === 'prepared'
                        ? 'text-emerald-400'
                        : executableState.status === 'ready'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {executableState.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Helper Card */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Integration Guidelines
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                This state payload can be consumed by your local automation test harness or simulator. When connecting external runners, configure them to match the target executable and working directory specified in this state.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

