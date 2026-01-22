import { useState, useEffect } from 'react';
import { useFirmware, type Device, type OtaStatus, type Firmware, type Platform } from '../../hooks/useFirmware';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function FirmwareManagement() {
  const { listFirmwares, uploadFirmware, listDevices, startOta, getOtaStatus, isLoading, error } = useFirmware();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [checksum, setChecksum] = useState('');
  const [uploadedFirmware, setUploadedFirmware] = useState<Firmware | null>(null);
  const [otaStatuses, setOtaStatuses] = useState<Record<string, OtaStatus>>({});
  const [availableFirmwares, setAvailableFirmwares] = useState<Firmware[]>([]);
  const [selectedFirmwareKey, setSelectedFirmwareKey] = useState<string>('');
  const [useExisting, setUseExisting] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');

  // Carregar dispositivos e firmwares ao montar
  useEffect(() => {
    loadDevices();
    loadAvailableFirmwares();
  }, []);

  // Polling do status do OTA para dispositivos em progresso
  useEffect(() => {
    const devicesInProgress = Object.values(otaStatuses).filter(
      status => status.status === 'in_progress'
    );

    if (devicesInProgress.length === 0) {
      return;
    }

    const interval = setInterval(async () => {
      for (const status of devicesInProgress) {
        try {
          const currentStatus = await getOtaStatus(status.deviceId);
          if (currentStatus) {
            setOtaStatuses(prev => ({
              ...prev,
              [status.deviceId]: currentStatus,
            }));
          } else {
            // OTA concluído ou cancelado
            setOtaStatuses(prev => ({
              ...prev,
              [status.deviceId]: {
                ...prev[status.deviceId],
                status: 'success',
                completedAt: new Date().toISOString(),
              },
            }));
          }
        } catch (err) {
          console.error(`Erro ao obter status OTA para ${status.deviceId}:`, err);
        }
      }
    }, 1000); // Atualizar a cada 1 segundo

    return () => clearInterval(interval);
  }, [otaStatuses, getOtaStatus]);

  const loadAvailableFirmwares = async () => {
    try {
      const firmwares = await listFirmwares();
      setAvailableFirmwares(firmwares);
      
      // Selecionar o primeiro automaticamente se houver
      if (firmwares.length > 0 && !selectedFirmwareKey) {
        setSelectedFirmwareKey(firmwares[0].key);
        setUploadedFirmware(firmwares[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar firmwares:', err);
    }
  };

  const loadDevices = async () => {
    try {
      const devicesList = await listDevices();
      setDevices(devicesList);
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Sugerir versão baseada no nome do arquivo
      const match = file.name.match(/v?(\d+\.\d+\.\d+)/);
      if (match) {
        setVersion(match[1]);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !version) {
      alert('Selecione um arquivo e informe a versão');
      return;
    }

    if (selectedPlatform === 'all') {
      alert('Selecione a plataforma (Edge-Go ou Edge-Pro)');
      return;
    }

    try {
      const firmware = await uploadFirmware(selectedFile, version, selectedPlatform as Platform);
      setUploadedFirmware(firmware);
      
      // Recarregar lista de firmwares e selecionar o novo
      await loadAvailableFirmwares();
      setSelectedFirmwareKey(firmware.key);
      
      // Voltar para modo de seleção
      setUseExisting(true);
      setSelectedFile(null);
      
      alert(`Firmware ${version} (${selectedPlatform}) enviado com sucesso!`);
    } catch (err) {
      alert(`Erro ao fazer upload: ${err}`);
    }
  };

  const handleStartOta = async () => {
    if (selectedDevices.size === 0) {
      alert('Selecione pelo menos um dispositivo');
      return;
    }

    if (!uploadedFirmware) {
      alert('Faça upload de um firmware primeiro');
      return;
    }

    if (!checksum) {
      alert('Informe o checksum SHA256 do firmware');
      return;
    }

    // Validar compatibilidade de plataforma
    const selectedDeviceList = devices.filter(d => selectedDevices.has(d.deviceId));
    const incompatibleDevices = selectedDeviceList.filter(
      d => d.platform && uploadedFirmware.platform && d.platform !== uploadedFirmware.platform
    );

    if (incompatibleDevices.length > 0) {
      const incompatibleNames = incompatibleDevices.map(d => d.name || d.deviceId).join(', ');
      alert(
        `Erro: O firmware selecionado é para ${uploadedFirmware.platform}, mas os seguintes dispositivos são ${incompatibleDevices[0].platform}:\n${incompatibleNames}\n\nSelecione apenas dispositivos compatíveis.`
      );
      return;
    }

    const versionText = uploadedFirmware.version || 'versão desconhecida';
    const platformText = uploadedFirmware.platform || 'desconhecida';
    if (!confirm(`Deseja atualizar ${selectedDevices.size} dispositivo(s) ${platformText} para a versão ${versionText}?`)) {
      return;
    }

    try {
      const deviceIds = Array.from(selectedDevices);
      const results = await startOta(deviceIds, uploadedFirmware.url, uploadedFirmware.version, checksum);
      setOtaStatuses(results);
      alert(`OTA iniciado para ${deviceIds.length} dispositivo(s)!`);
    } catch (err) {
      alert(`Erro ao iniciar OTA: ${err}`);
    }
  };

  const toggleDevice = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  const selectAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.map(d => d.deviceId)));
    }
  };

  const handleFirmwareSelect = (key: string) => {
    setSelectedFirmwareKey(key);
    const firmware = availableFirmwares.find(f => f.key === key);
    if (firmware) {
      setUploadedFirmware(firmware);
      setVersion(firmware.version || '');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Firmware</h1>
          <p className="text-gray-600 mt-1">Atualize seus dispositivos Edge-Go e Edge-Pro remotamente via OTA</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Seleção ou Upload de Firmware */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Selecionar Firmware</h2>
            <div className="flex gap-2">
              <Button
                variant={useExisting ? 'default' : 'secondary'}
                onClick={() => setUseExisting(true)}
              >
                Usar Existente
              </Button>
              <Button
                variant={!useExisting ? 'default' : 'secondary'}
                onClick={() => setUseExisting(false)}
              >
                Upload Novo
              </Button>
            </div>
          </div>

          {useExisting ? (
            /* Seleção de firmware existente */
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Firmware disponível no R2 ({availableFirmwares.length})
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'all')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas as plataformas</option>
                  <option value="edge-go">Edge-Go (ESP32)</option>
                  <option value="edge-pro">Edge-Pro (Raspberry Pi)</option>
                </select>
              </div>
              {availableFirmwares.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded border border-gray-200">
                  Nenhum firmware encontrado. Faça upload de um firmware para começar.
                </div>
              ) : (
                <select
                  value={selectedFirmwareKey}
                  onChange={(e) => handleFirmwareSelect(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableFirmwares
                    .filter(f => selectedPlatform === 'all' || f.platform === selectedPlatform)
                    .map((firmware) => (
                      <option key={firmware.key} value={firmware.key}>
                        {firmware.platform === 'edge-go' ? '🟢' : firmware.platform === 'edge-pro' ? '🔵' : '⚪'} {firmware.name} 
                        {firmware.version && ` (v${firmware.version})`} • 
                        {firmware.platform ? firmware.platform.toUpperCase() : 'N/A'} • 
                        {(firmware.size / 1024 / 1024).toFixed(2)} MB • 
                        {new Date(firmware.uploadedAt).toLocaleDateString('pt-BR')}
                      </option>
                    ))}
                </select>
              )}
            </div>
          ) : (
            /* Upload de novo firmware */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload de Novo Firmware</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plataforma *
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'all')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Selecione a plataforma</option>
                  <option value="edge-go">Edge-Go (ESP32)</option>
                  <option value="edge-pro">Edge-Pro (Raspberry Pi)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo {selectedPlatform === 'edge-go' ? '.bin' : selectedPlatform === 'edge-pro' ? '(binário Go)' : ''}
                </label>
                <input
                  type="file"
                  accept={selectedPlatform === 'edge-go' ? '.bin' : '*'}
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Versão (ex: 1.0.1)
                </label>
                <Input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.1"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleUpload} disabled={!selectedFile || !version || selectedPlatform === 'all' || isLoading}>
                  {isLoading ? 'Enviando...' : 'Fazer Upload e Usar'}
                </Button>
              </div>
            </div>
          )}

          {/* SHA256 Checksum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SHA256 Checksum
            </label>
            <Input
              type="text"
              value={checksum}
              onChange={(e) => setChecksum(e.target.value)}
              placeholder="abc123def456..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Obrigatório para OTA. Gere com: <code className="bg-gray-100 px-1 rounded">shasum -a 256 firmware.bin</code>
            </p>
          </div>
        </div>
      </Card>

      {/* Firmware atual carregado */}
      {uploadedFirmware && (
        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Firmware pronto: v{uploadedFirmware.version}
                  {uploadedFirmware.platform && (
                    <span className="ml-2 text-sm font-normal">
                      ({uploadedFirmware.platform === 'edge-go' ? '🟢 Edge-Go' : '🔵 Edge-Pro'})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {(uploadedFirmware.size / 1024 / 1024).toFixed(2)} MB • 
                  Enviado em {new Date(uploadedFirmware.uploadedAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-green-600 mt-1 font-mono break-all">
                  {uploadedFirmware.url}
                </p>
              </div>
              <Button
                onClick={handleStartOta}
                disabled={selectedDevices.size === 0 || !checksum}
              >
                Iniciar OTA ({selectedDevices.size})
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de dispositivos */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Dispositivos Edge ({devices.length})
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'all')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as plataformas</option>
                <option value="edge-go">Edge-Go (ESP32)</option>
                <option value="edge-pro">Edge-Pro (Raspberry Pi)</option>
              </select>
              <Button variant="secondary" onClick={loadDevices} disabled={isLoading}>
                Atualizar
              </Button>
              <Button variant="secondary" onClick={selectAll}>
                {selectedDevices.size === devices.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>
          </div>

          {isLoading && devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Carregando dispositivos...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum dispositivo conectado</div>
          ) : (
            <div className="space-y-3">
              {devices
                .filter(d => selectedPlatform === 'all' || d.platform === selectedPlatform)
                .map((device) => {
                const isSelected = selectedDevices.has(device.deviceId);
                const otaStatus = otaStatuses[device.deviceId];

                return (
                  <div
                    key={device.deviceId}
                    className={`
                      border rounded-lg p-4 transition-all cursor-pointer
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                    `}
                    onClick={() => toggleDevice(device.deviceId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDevice(device.deviceId)}
                          className="w-5 h-5 text-blue-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">
                              {device.platform === 'edge-go' ? '🟢' : device.platform === 'edge-pro' ? '🔵' : '⚪'} {' '}
                              {device.clientName && (
                                <span className="text-gray-600 font-normal">
                                  {device.clientName}
                                  {device.operationName && ` / ${device.operationName}`} • 
                                </span>
                              )}
                              {device.name || device.deviceId}
                            </h3>
                            <span
                              className={`
                                px-2 py-1 text-xs font-medium rounded-full
                                ${device.platform === 'edge-go' 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : device.platform === 'edge-pro'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-gray-50 text-gray-700'}
                              `}
                            >
                              {device.platform === 'edge-go' ? 'ESP32' : device.platform === 'edge-pro' ? 'Raspberry Pi' : 'N/A'}
                            </span>
                            <span
                              className={`
                                px-2 py-1 text-xs font-medium rounded-full
                                ${device.status === 'online' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'}
                              `}
                            >
                              {device.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {device.deviceId} • Versão atual: {device.currentVersion || 'Desconhecida'} • 
                            Visto em: {new Date(device.lastSeen).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Status de OTA */}
                      {otaStatus && (
                        <div className="flex items-center gap-2">
                          {otaStatus.status === 'in_progress' && (
                            <span className="text-blue-600 text-sm">
                              Atualizando... {otaStatus.progress || 0}%
                            </span>
                          )}
                          {otaStatus.status === 'success' && (
                            <span className="text-green-600 text-sm">Concluído</span>
                          )}
                          {otaStatus.status === 'failed' && (
                            <span className="text-red-600 text-sm" title={otaStatus.error}>
                              Falhou
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Instruções */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Como usar:</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Selecione um firmware existente no R2 ou faça upload de um novo</li>
            <li>Informe o checksum SHA256 do firmware</li>
            <li>Selecione os dispositivos que deseja atualizar</li>
            <li>Clique em "Iniciar OTA" para começar a atualização</li>
            <li>Os dispositivos irão reiniciar automaticamente após a atualização</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            💡 Dica: Os firmwares ficam salvos no R2 e podem ser reutilizados para atualizar outros dispositivos.
          </p>
        </div>
      </Card>
    </div>
  );
}

