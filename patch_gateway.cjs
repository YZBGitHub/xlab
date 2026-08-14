const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Initial State
const targetInit = `    type: '执行器' as '执行器' | '传感器',
    
    // Power (Shared)`;
const replaceInit = `    type: '执行器' as '执行器' | '传感器' | '网关',
    
    // Gateway
    gatewayType: '云平台网关',

    // Power (Shared)`;
content = content.replace(targetInit, replaceInit);

// 2. Total Steps
const targetSteps = `  const totalSteps = formData.type === '执行器' ? 5 : 4;`;
const replaceSteps = `  const totalSteps = formData.type === '执行器' ? 5 : (formData.type === '传感器' ? 4 : 3);`;
content = content.replace(targetSteps, replaceSteps);

// 3. Booleans
const targetBool = `  const isActuator = formData.type === '执行器';`;
const replaceBool = `  const isActuator = formData.type === '执行器';
  const isSensor = formData.type === '传感器';
  const isGateway = formData.type === '网关';`;
content = content.replace(targetBool, replaceBool);

// 4. StepIndicators
const targetIndicators = `              <StepIndicator num={1} label="基础信息" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
              <StepIndicator 
                num={2} 
                label={isActuator ? '供电方式' : '供电电压'} 
                active={step === 2} 
                done={step > 2} 
                onClick={() => step > 1 && setStep(2)} 
              />
              <StepIndicator 
                num={3} 
                label={isActuator ? '端口设置' : '设备协议'} 
                active={step === 3} 
                done={step > 3} 
                onClick={() => step > 2 && setStep(3)} 
              />
              {isActuator && (
                <StepIndicator num={4} label="状态设置" active={step === 4} done={step > 4} onClick={() => step > 3 && setStep(4)} />
              )}
              <StepIndicator num={totalSteps} label="确认生成" active={step === totalSteps} done={step > totalSteps} onClick={() => step === totalSteps && setStep(totalSteps)} />`;
const replaceIndicators = `              <StepIndicator num={1} label="基础信息" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
              <StepIndicator 
                num={2} 
                label={isActuator ? '供电方式' : (isSensor ? '供电电压' : '网关配置')} 
                active={step === 2} 
                done={step > 2} 
                onClick={() => step > 1 && setStep(2)} 
              />
              {!isGateway && (
                <StepIndicator 
                  num={3} 
                  label={isActuator ? '端口设置' : '设备协议'} 
                  active={step === 3} 
                  done={step > 3} 
                  onClick={() => step > 2 && setStep(3)} 
                />
              )}
              {isActuator && (
                <StepIndicator num={4} label="状态设置" active={step === 4} done={step > 4} onClick={() => step > 3 && setStep(4)} />
              )}
              <StepIndicator num={totalSteps} label="确认生成" active={step === totalSteps} done={step > totalSteps} onClick={() => step === totalSteps && setStep(totalSteps)} />`;
content = content.replace(targetIndicators, replaceIndicators);

// 5. Form Area Renders
const targetRenders = `            {step === 1 && <Step1BasicInfo data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 2 && <Step2Power data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 3 && isActuator && <Step3ActuatorPorts data={formData} />}
            {step === 4 && isActuator && <Step4ActuatorStatus data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 3 && !isActuator && <Step3SensorProtocol data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === totalSteps && <StepConfirm data={formData} />}`;
const replaceRenders = `            {step === 1 && <Step1BasicInfo data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 2 && !isGateway && <Step2Power data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 2 && isGateway && <Step2Gateway data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 3 && isActuator && <Step3ActuatorPorts data={formData} />}
            {step === 4 && isActuator && <Step4ActuatorStatus data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 3 && isSensor && <Step3SensorProtocol data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === totalSteps && <StepConfirm data={formData} />}`;
content = content.replace(targetRenders, replaceRenders);

// 6. Step1BasicInfo Type Radio
const targetTypeRadio = `          <div className="flex gap-4">
            <RadioBox label="执行器" active={data.type === '执行器'} onClick={() => update({ type: '执行器' })} className="w-32" />
            <RadioBox label="传感器" active={data.type === '传感器'} onClick={() => update({ type: '传感器' })} className="w-32" />
          </div>`;
const replaceTypeRadio = `          <div className="flex gap-4">
            <RadioBox label="执行器" active={data.type === '执行器'} onClick={() => update({ type: '执行器' })} className="w-32" />
            <RadioBox label="传感器" active={data.type === '传感器'} onClick={() => update({ type: '传感器' })} className="w-32" />
            <RadioBox label="网关" active={data.type === '网关'} onClick={() => update({ type: '网关' })} className="w-32" />
          </div>`;
content = content.replace(targetTypeRadio, replaceTypeRadio);

// 7. Add Step2Gateway component
const step2GatewayCode = `
function Step2Gateway({ data, update }: any) {
  const isCloud = data.gatewayType === '云平台网关';
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1">网关配置</h4>
        <p className="text-sm text-gray-500">选择网关类型，接线点将自动配置。</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">网关类型</label>
          <div className="flex gap-4">
            <RadioBox label="云平台网关" active={data.gatewayType === '云平台网关'} onClick={() => update({ gatewayType: '云平台网关' })} className="w-40" />
            <RadioBox label="4G-DTU网关 (RS485型)" active={data.gatewayType === '4G-DTU网关 (RS485型)'} onClick={() => update({ gatewayType: '4G-DTU网关 (RS485型)' })} className="w-56" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="text-sm font-bold text-gray-700 mb-3">系统分配端口</div>
          <div className="flex gap-3">
            {isCloud ? (
              <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="network" /><Tag label="power" /></>
            ) : (
              <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="vs" /><Tag label="gnd" /></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

const insertPoint = `function Step2Power({ data, update }: any) {`;
content = content.replace(insertPoint, step2GatewayCode + '\n' + insertPoint);


// 8. StepConfirm
const targetConfirmIsActuator = `function StepConfirm({ data }: { data: any }) {
  const isActuator = data.type === '执行器';`;
const replaceConfirmIsActuator = `function StepConfirm({ data }: { data: any }) {
  const isActuator = data.type === '执行器';
  const isSensor = data.type === '传感器';
  const isGateway = data.type === '网关';`;
content = content.replace(targetConfirmIsActuator, replaceConfirmIsActuator);


const targetConfirmPower = `        {/* Power */}
        <div className="p-5">`;
const replaceConfirmPower = `        {/* Power */}
        {!isGateway && (
        <div className="p-5">`;
content = content.replace(targetConfirmPower, replaceConfirmPower);

const targetConfirmPowerEnd = `            )}
          </div>
        </div>`;
const replaceConfirmPowerEnd = `            )}
          </div>
        </div>
        )}`;
content = content.replace(targetConfirmPowerEnd, replaceConfirmPowerEnd);


const targetConfirmSensor = `        {/* Sensor Specific */}
        {!isActuator && (
          <div className="p-5">`;
const replaceConfirmSensor = `        {/* Sensor Specific */}
        {isSensor && (
          <div className="p-5">`;
content = content.replace(targetConfirmSensor, replaceConfirmSensor);

const gatewayConfirmCode = `
        {/* Gateway Specific */}
        {isGateway && (
          <div className="p-5">
            <div className="text-xs font-bold text-gray-400 uppercase mb-4">网关配置</div>
            <div className="space-y-4">
              <div><span className="text-gray-500 text-sm">网关类型：</span> <span className="text-gray-800 font-medium text-sm">{data.gatewayType}</span></div>
              <div>
                <span className="text-gray-500 text-sm mb-2 block">系统分配端口：</span> 
                <div className="flex gap-2">
                  {data.gatewayType === '云平台网关' ? (
                    <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="network" /><Tag label="power" /></>
                  ) : (
                    <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="vs" /><Tag label="gnd" /></>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
`;

const insertGatewayConfirm = `      </div>
    </div>
  );
}`;

content = content.replace(insertGatewayConfirm, gatewayConfirmCode + '\n' + insertGatewayConfirm);

fs.writeFileSync(path, content);
