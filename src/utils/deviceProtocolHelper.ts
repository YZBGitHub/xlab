export interface ModbusRegisterItem {
  name: string;
  key?: string;
  functionCode: string;
  addressHex: string;
  addressDec: number;
  lengthWords: number;
  dataType: string;
  formula: string;
  unit: string;
  range: string;
}

export interface CommandFrameExample {
  title: string;
  type: 'read' | 'write';
  requestHex: string;
  requestExplain: { part: string; meaning: string; color: string }[];
  responseHex: string;
  responseExplain: { part: string; meaning: string; color: string }[];
  resultSummary: string;
}

export interface AnalogFormulaExample {
  name?: string;
  key?: string;
  signalType: string;
  voltageOrCurrentRange: string;
  physicalRange: string;
  formulaLatex: string;
  calculationExample: {
    inputLabel: string;
    inputValue: string;
    steps: string[];
    result: string;
  };
  adcRelation: string;
}

export interface DigitalSignalExample {
  propertyName: string;
  propertyKey?: string;
  key?: string;
  zeroLabel: string;
  oneLabel: string;
  defaultVal: string;
  triggerMode: string;
  signalType: string;
  pins: { pin: string; name: string; desc: string }[];
  stateTable: Array<{ level: string; logicVal: string; stateMeaning: string }>;
}

export interface DeviceProtocolInfo {
  protocolCategory: 'modbus' | 'analog' | 'digital' | 'none';
  protocolName: string;
  modbusRegisters?: ModbusRegisterItem[];
  commandExamples?: CommandFrameExample[];
  analogFormula?: AnalogFormulaExample;
  digitalSignal?: DigitalSignalExample;
}

export function getDeviceProtocolInfo(device: any): DeviceProtocolInfo {
  if (!device) {
    return { protocolCategory: 'none', protocolName: '标准协议' };
  }

  const name = String(device.name || '').toLowerCase();
  const rawProtocol = String(device.inferredProtocol || device.protocol || '').toLowerCase();
  const type = String(device.inferredType || (typeof device.type === 'string' ? device.type : '') || '').toLowerCase();
  const isCustom = Boolean(device.isCustom || String(device.id || '').toLowerCase().startsWith('custom_') || (device.categoryPath && String(device.categoryPath).includes('自定义')));

  // 1. 判断是否为数字量设备
  const isDigital = (
    rawProtocol.includes('数字') ||
    rawProtocol.includes('digital') ||
    rawProtocol.includes('开关量') ||
    Boolean(device.digitalConfig)
  );

  // 2. 判断是否为模拟量设备（包括自定义设备带有 analogConfig 或 protocol 为模拟量）
  const isAnalog = !isDigital && (
    rawProtocol.includes('模拟') ||
    rawProtocol.includes('analog') ||
    rawProtocol.includes('4-20ma') ||
    rawProtocol.includes('0-5v') ||
    rawProtocol.includes('0-10v') ||
    name.includes('模拟') ||
    name.includes('4-20ma') ||
    name.includes('0-5v') ||
    name.includes('0-10v') ||
    name.includes('变送器') ||
    Boolean(device.analogConfig)
  );

  // 3. 判断是否为 Modbus 设备（包括自定义设备带有 modbusAttrs 或 protocol 为 Modbus）
  const isExplicitWireless = rawProtocol.includes('zigbee') || rawProtocol.includes('lora') || rawProtocol.includes('蓝牙') || rawProtocol.includes('bluetooth') || rawProtocol.includes('mqtt') || type.includes('网关');

  const isModbus = !isDigital && !isAnalog && (
    rawProtocol.includes('modbus') ||
    rawProtocol.includes('485') ||
    rawProtocol.includes('rtu') ||
    rawProtocol.includes('tcp') ||
    name.includes('modbus') ||
    name.includes('485') ||
    name.includes('rtu') ||
    Boolean(device.modbusAttrs && Array.isArray(device.modbusAttrs) && device.modbusAttrs.length > 0) ||
    (isCustom && !isExplicitWireless) ||
    (!isExplicitWireless && !rawProtocol.includes('其他'))
  );

  // 分支 1: 数字量协议 (Digital Signal - 0/1)
  if (isDigital) {
    const propName = device.digitalConfig?.propertyName || (name.includes('人体') ? '人体感应' : name.includes('门磁') ? '门磁状态' : name.includes('水浸') ? '水浸状态' : '开关状态');
    const zeroLabel = device.digitalConfig?.zeroLabel || (name.includes('人体') ? '无人' : name.includes('门磁') ? '关闭' : name.includes('水浸') ? '无水' : '0 (正常)');
    const oneLabel = device.digitalConfig?.oneLabel || (name.includes('人体') ? '有人' : name.includes('门磁') ? '开启' : name.includes('水浸') ? '有水/告警' : '1 (触发)');
    const defaultVal = device.digitalConfig?.defaultVal || '0';
    const triggerMode = device.digitalConfig?.triggerMode || '高电平有效 (Active High)';

    return {
      protocolCategory: 'digital',
      protocolName: '数字量',
      digitalSignal: {
        propertyName: propName,
        propertyKey: device.digitalConfig?.propertyKey || device.digitalConfig?.key || (name.includes('人体') ? 'human_presence' : name.includes('门磁') ? 'door_contact' : 'state_signal'),
        key: device.digitalConfig?.propertyKey || device.digitalConfig?.key || (name.includes('人体') ? 'human_presence' : name.includes('门磁') ? 'door_contact' : 'state_signal'),
        zeroLabel,
        oneLabel,
        defaultVal,
        triggerMode,
        signalType: 'TTL 0/1 电平逻辑信号 (0V / 3.3V~5V)',
        pins: [
          { pin: 'vs', name: '电源正极', desc: 'DC 5V / 12V / 24V 供电输入' },
          { pin: 'gnd', name: '电源负极', desc: '电源地 / 信号参考地' },
          { pin: 'signal', name: '数字信号输出端', desc: '输出 0 或 1 电平信号，连接控制器DI/GPIO' }
        ],
        stateTable: [
          { level: '低电平 (0V)', logicVal: '0', stateMeaning: zeroLabel },
          { level: '高电平 (3.3V / 5V)', logicVal: '1', stateMeaning: oneLabel }
        ]
      }
    };
  }

  // 分支 2: 模拟量协议
  if (isAnalog) {
    let signalType = '0~5V 模拟电压信号';
    let voltageOrCurrentRange = '0.00 ~ 5.00 V';
    let physicalRange = '-40.0 ~ 80.0 ℃';
    let isCurrent = false;

    if (device.analogConfig) {
      isCurrent = device.analogConfig.type === '电流' || (device.analogConfig.unit && String(device.analogConfig.unit).includes('mA'));
      signalType = isCurrent ? '4~20mA 电流信号' : `${device.analogConfig.range || '0-5'}V 模拟电压信号`;
      voltageOrCurrentRange = isCurrent ? '4.00 ~ 20.00 mA' : '0.00 ~ 5.00 V';
      physicalRange = `${device.analogConfig.min || 0} ~ ${device.analogConfig.max || 100} ${device.analogConfig.unit || ''}`.trim();
    } else {
      isCurrent = name.includes('4-20ma') || name.includes('电流') || name.includes('变送器') || rawProtocol.includes('4-20ma');
      signalType = isCurrent ? '4~20mA 电流信号' : '0~5V 模拟电压信号';
      voltageOrCurrentRange = isCurrent ? '4.00 ~ 20.00 mA' : '0.00 ~ 5.00 V';
      physicalRange = name.includes('温') ? '-40.0 ~ 80.0 ℃' : name.includes('压') ? '0.00 ~ 1.60 MPa' : name.includes('液位') ? '0.00 ~ 5.00 m' : '0.00 ~ 100.00 %';
    }

    return {
      protocolCategory: 'analog',
      protocolName: '模拟量',
      analogFormula: {
        name: device.analogConfig?.name || (name.includes('光照') ? '光照度' : name.includes('温') ? '环境温度' : name.includes('压') ? '管道压力' : '采集物理量'),
        key: device.analogConfig?.key || (name.includes('光照') ? 'light_intensity' : name.includes('温') ? 'temperature' : name.includes('压') ? 'pressure' : 'analog_value'),
        signalType,
        voltageOrCurrentRange,
        physicalRange,
        formulaLatex: isCurrent
          ? 'Y = ((I - 4) / 16) * (Ymax - Ymin) + Ymin'
          : 'Y = (V / 5) * (Ymax - Ymin) + Ymin',
        calculationExample: isCurrent
          ? {
              inputLabel: '采样电流',
              inputValue: '12.00 mA',
              steps: [
                '① 输入比率: (12 - 4) / 16 = 50.0%',
                `② 量程映射 [${physicalRange}]: 50.0% * (Ymax - Ymin) + Ymin`
              ],
              result: name.includes('温') ? '20.0 ℃' : name.includes('压') ? '0.80 MPa' : '50.0 %'
            }
          : {
              inputLabel: '采样电压',
              inputValue: '2.50 V (0~5V)',
              steps: [
                '① 输入比率: 2.50 / 5.00 = 50.0%',
                `② 量程映射 [${physicalRange}]: 50.0% * (Ymax - Ymin) + Ymin`
              ],
              result: name.includes('温') ? '20.0 ℃' : name.includes('压') ? '0.80 MPa' : '50.0 %'
            },
        adcRelation: 'RAW / 4095 * Vref (12位 ADC 0~4095)'
      }
    };
  }

  // 2. Modbus 协议分支
  if (isModbus) {
    let registers: ModbusRegisterItem[] = [];
    let commandExamples: CommandFrameExample[] = [];

    // 若自定义设备中明确定义了 modbusAttrs
    if (device.modbusAttrs && Array.isArray(device.modbusAttrs) && device.modbusAttrs.length > 0) {
      registers = device.modbusAttrs.map((attr: any, idx: number) => ({
        name: attr.name || `属性 ${idx + 1}`,
        key: attr.key || (attr.name?.includes('温') ? 'temperature' : attr.name?.includes('湿') ? 'humidity' : `attr_${idx + 1}`),
        functionCode: attr.funcCode || '0x03',
        addressHex: attr.startAddr ? (String(attr.startAddr).startsWith('0x') ? attr.startAddr : `0x${String(attr.startAddr).padStart(4, '0')}`) : `0x000${idx}`,
        addressDec: parseInt(attr.startAddr || `${idx}`, 16) || idx,
        lengthWords: parseInt(attr.dataLen || '1', 10) || 1,
        dataType: attr.dataLen === '2' ? 'UInt32' : 'UInt16',
        formula: attr.formula || 'RAW / 10.0',
        unit: attr.unit || '-',
        range: attr.range || '0 ~ 100'
      }));

      const primaryAttr = registers[0];
      commandExamples = [
        {
          title: `读取${primaryAttr.name} (${String(primaryAttr.functionCode).split('/')[0].trim()})`,
          type: 'read',
          requestHex: `01 03 ${String(primaryAttr.addressHex).replace('0x', '').padStart(4, '0')} 00 01 84 0A`,
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: primaryAttr.addressHex, meaning: `地址 ${primaryAttr.addressHex}`, color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 01 04 B9 D3',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '01 04', meaning: `${primaryAttr.name}: 260 -> 26.0 ${primaryAttr.unit !== '-' ? primaryAttr.unit : ''}`, color: 'purple' },
            { part: 'B9 D3', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: `${primaryAttr.name} 测量值为 26.0 ${primaryAttr.unit !== '-' ? primaryAttr.unit : ''}。`
        }
      ];
    } else if (name.includes('温湿度') || name.includes('th') || (name.includes('温') && name.includes('湿'))) {
      registers = [
        { name: '温度', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'Int16', formula: 'RAW / 10.0', unit: '℃', range: '-40.0 ~ 80.0' },
        { name: '湿度', functionCode: '0x03 / 0x04', addressHex: '0x0001', addressDec: 1, lengthWords: 1, dataType: 'UInt16', formula: 'RAW / 10.0', unit: '%RH', range: '0.0 ~ 100.0' }
      ];
      commandExamples = [
        {
          title: '读取温度与湿度 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 02 C4 0B',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 02', meaning: '数量 2', color: 'purple' },
            { part: 'C4 0B', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 04 01 04 02 58 BA 9C',
          responseExplain: [
            { part: '01 03 04', meaning: '从机 01 / FC 03 / 4字节', color: 'blue' },
            { part: '01 04', meaning: '温度: 260 -> 26.0 ℃', color: 'purple' },
            { part: '02 58', meaning: '湿度: 600 -> 60.0 %RH', color: 'purple' },
            { part: 'BA 9C', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '温度 26.0 ℃，湿度 60.0 %RH。'
        }
      ];
    } else if (name.includes('光照') || name.includes('照度') || name.includes('lux') || name.includes('光强')) {
      registers = [
        { name: '光照强度', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 2, dataType: 'UInt32', formula: 'RAW', unit: 'Lux', range: '0 ~ 200000' }
      ];
      commandExamples = [
        {
          title: '读取光照强度 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 02 C4 0B',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 02', meaning: '数量 2', color: 'purple' },
            { part: 'C4 0B', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 04 00 00 07 D0 BB 86',
          responseExplain: [
            { part: '01 03 04', meaning: '从机 01 / FC 03 / 4字节', color: 'blue' },
            { part: '00 00 07 D0', meaning: '光照值 0x07D0 -> 2000 Lux', color: 'purple' },
            { part: 'BB 86', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '光照强度 2000 Lux。'
        }
      ];
    } else if (name.includes('co2') || name.includes('二氧化碳')) {
      registers = [
        { name: '二氧化碳浓度', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW', unit: 'ppm', range: '0 ~ 5000' }
      ];
      commandExamples = [
        {
          title: '读取二氧化碳浓度 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 01 84 0A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 02 E4 B8 95',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '02 E4', meaning: 'CO2: 0x02E4 (740) -> 740 ppm', color: 'purple' },
            { part: 'B8 95', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '二氧化碳浓度 740 ppm。'
        }
      ];
    } else if (name.includes('pm2.5') || name.includes('pm25') || name.includes('粉尘') || name.includes('颗粒物') || name.includes('空气')) {
      registers = [
        { name: 'PM2.5', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW', unit: 'μg/m³', range: '0 ~ 1000' },
        { name: 'PM10', functionCode: '0x03 / 0x04', addressHex: '0x0001', addressDec: 1, lengthWords: 1, dataType: 'UInt16', formula: 'RAW', unit: 'μg/m³', range: '0 ~ 1000' }
      ];
      commandExamples = [
        {
          title: '读取 PM2.5 与 PM10 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 02 C4 0B',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 02', meaning: '数量 2', color: 'purple' },
            { part: 'C4 0B', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 04 00 1E 00 2D 7A 54',
          responseExplain: [
            { part: '01 03 04', meaning: '从机 01 / FC 03 / 4字节', color: 'blue' },
            { part: '00 1E', meaning: 'PM2.5: 30 μg/m³', color: 'purple' },
            { part: '00 2D', meaning: 'PM10: 45 μg/m³', color: 'purple' },
            { part: '7A 54', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: 'PM2.5 30 μg/m³，PM10 45 μg/m³。'
        }
      ];
    } else if (name.includes('土壤') || name.includes('水分') || name.includes('墒情')) {
      registers = [
        { name: '土壤湿度', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW / 10.0', unit: '%RH', range: '0.0 ~ 100.0' },
        { name: '土壤温度', functionCode: '0x03 / 0x04', addressHex: '0x0001', addressDec: 1, lengthWords: 1, dataType: 'Int16', formula: 'RAW / 10.0', unit: '℃', range: '-40.0 ~ 80.0' }
      ];
      commandExamples = [
        {
          title: '读取土壤湿度与温度 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 02 C4 0B',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 02', meaning: '数量 2', color: 'purple' },
            { part: 'C4 0B', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 04 01 F4 00 F0 AB 41',
          responseExplain: [
            { part: '01 03 04', meaning: '从机 01 / FC 03 / 4字节', color: 'blue' },
            { part: '01 F4', meaning: '湿度: 500 -> 50.0 %RH', color: 'purple' },
            { part: '00 F0', meaning: '温度: 240 -> 24.0 ℃', color: 'purple' },
            { part: 'AB 41', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '土壤湿度 50.0 %RH，土壤温度 24.0 ℃。'
        }
      ];
    } else if (name.includes('液位') || name.includes('水位') || name.includes('水深')) {
      registers = [
        { name: '液位高度', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW / 100.0', unit: 'm', range: '0.00 ~ 5.00' }
      ];
      commandExamples = [
        {
          title: '读取液位高度 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 01 84 0A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 00 FA 39 F7',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '00 FA', meaning: '液位: 250 -> 2.50 m', color: 'purple' },
            { part: '39 F7', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '液位高度 2.50 m。'
        }
      ];
    } else if (name.includes('风速')) {
      registers = [
        { name: '风速', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW / 10.0', unit: 'm/s', range: '0.0 ~ 60.0' }
      ];
      commandExamples = [
        {
          title: '读取风速 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 01 84 0A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 00 38 B8 5E',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '00 38', meaning: '风速: 56 -> 5.6 m/s', color: 'purple' },
            { part: 'B8 5E', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '风速 5.6 m/s。'
        }
      ];
    } else if (name.includes('风向')) {
      registers = [
        { name: '风向角度', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW', unit: '°', range: '0 ~ 360' }
      ];
      commandExamples = [
        {
          title: '读取风向 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 01 84 0A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 00 5A 38 5B',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '00 5A', meaning: '角度: 90° (东风)', color: 'purple' },
            { part: '38 5B', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '风向角度 90° (正东)。'
        }
      ];
    } else if (name.includes('压力') || name.includes('气压') || name.includes('水压')) {
      registers = [
        { name: '压力', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW / 100.0', unit: 'kPa', range: '0.0 ~ 1600.0' }
      ];
      commandExamples = [
        {
          title: '读取压力值 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 01 84 0A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 03 E8 B8 FA',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '03 E8', meaning: '压力: 1000 -> 10.00 kPa', color: 'purple' },
            { part: 'B8 FA', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '压力 10.00 kPa。'
        }
      ];
    } else if (name.includes('温度') || name.includes('水温') || name.includes('地温') || name.includes('热电偶')) {
      registers = [
        { name: '温度', functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'Int16', formula: 'RAW / 10.0', unit: '℃', range: '-40.0 ~ 125.0' }
      ];
      commandExamples = [
        {
          title: '读取温度 (0x03)',
          type: 'read',
          requestHex: '01 03 00 00 00 01 84 0A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 01 04 B9 D3',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '01 04', meaning: '温度: 260 -> 26.0 ℃', color: 'purple' },
            { part: 'B9 D3', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: '温度 26.0 ℃。'
        }
      ];
    } else if (name.includes('继电器') || name.includes('开关') || name.includes('断路器') || type.includes('继电器') || type.includes('执行器')) {
      registers = [
        { name: '开关状态', functionCode: '0x01 / 0x05', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'Bit', formula: '0xFF00=开, 0x0000=关', unit: '-', range: 'ON / OFF' }
      ];
      commandExamples = [
        {
          title: '闭合继电器 (写线圈 0x05)',
          type: 'write',
          requestHex: '01 05 00 00 FF 00 8C 3A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '05', meaning: 'FC 05', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: 'FF 00', meaning: '闭合 (FF00)', color: 'purple' },
            { part: '8C 3A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 05 00 00 FF 00 8C 3A',
          responseExplain: [
            { part: '01 05 00 00 FF 00 8C 3A', meaning: '原样确认回传', color: 'blue' }
          ],
          resultSummary: '继电器成功闭合导通。'
        }
      ];
    } else {
      // 提取传感器纯净物理量名称
      const cleanAttr = device.name ? String(device.name).replace(/(仿真|自定义|工业级|标准|传感器|探测器|采集器|变送器|模块|设备|modbus|485|rs485)/gi, '').trim() || '温度' : '温度';
      registers = [
        { name: cleanAttr, functionCode: '0x03 / 0x04', addressHex: '0x0000', addressDec: 0, lengthWords: 1, dataType: 'UInt16', formula: 'RAW / 10.0', unit: '℃', range: '0.0 ~ 100.0' }
      ];
      commandExamples = [
        {
          title: `读取${cleanAttr} (0x03)`,
          type: 'read',
          requestHex: '01 03 00 00 00 01 84 0A',
          requestExplain: [
            { part: '01', meaning: '从机 01', color: 'blue' },
            { part: '03', meaning: 'FC 03', color: 'emerald' },
            { part: '00 00', meaning: '地址 0x0000', color: 'amber' },
            { part: '00 01', meaning: '数量 1', color: 'purple' },
            { part: '84 0A', meaning: 'CRC16', color: 'rose' }
          ],
          responseHex: '01 03 02 00 C8 B9 D2',
          responseExplain: [
            { part: '01 03 02', meaning: '从机 01 / FC 03 / 2字节', color: 'blue' },
            { part: '00 C8', meaning: `${cleanAttr}: 200 -> 20.0`, color: 'purple' },
            { part: 'B9 D2', meaning: 'CRC16', color: 'rose' }
          ],
          resultSummary: `${cleanAttr} 20.0。`
        }
      ];
    }

    return {
      protocolCategory: 'modbus',
      protocolName: 'Modbus',
      modbusRegisters: registers,
      commandExamples
    };
  }

  return {
    protocolCategory: 'none',
    protocolName: device.protocol || device.inferredProtocol || '标准协议'
  };
}
