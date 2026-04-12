import { Catchment } from '../types';

/**
 * 使用推理公式法 (Rational Method) 计算峰值径流量
 * 公式: Q = C * i * A / 360
 * 其中:
 * Q 是峰值流量，单位：立方米/秒 (m³/s)
 * C 是径流系数 (runoff coefficient)，无量纲，表示降雨转化为径流的比例
 * i 是降雨强度 (rainfall intensity)，单位：毫米/小时 (mm/hr)
 * A 是汇水面积 (area)，单位：公顷 (hectares)
 * 360 是单位换算系数
 * 
 * @param catchment 汇水区对象，包含面积和径流系数等信息
 * @param rainfallIntensity 降雨强度
 * @returns 计算得出的峰值流量 (m³/s)
 */
export function calculatePeakRunoff(catchment: Catchment, rainfallIntensity: number): number {
  // 根据推理公式计算并返回结果
  return (catchment.runoffCoefficient * rainfallIntensity * catchment.area) / 360;
}

/**
 * 为给定的汇水区和降雨持续时间生成径流过程线 (Hydrograph)
 * 这里使用的是简化的推理公式过程线方法 (Simplified Rational Method hydrograph approach)
 * 
 * @param catchment 汇水区对象，包含汇流时间等信息
 * @param rainfallIntensity 降雨强度
 * @param stormDuration 降雨持续时间，默认值为60分钟
 * @returns 返回一个数组，包含每个时间点(time)及其对应的流量(flow)
 */
export function generateHydrograph(
  catchment: Catchment, 
  rainfallIntensity: number, 
  stormDuration: number = 60
): { time: number, flow: number }[] {
  // 获取汇水区的汇流时间 (Time of Concentration, tc)，如果没有设置则默认为15分钟
  const tc = catchment.timeOfConcentration || 15;
  // 调用上面的函数计算理论上的峰值流量
  const qPeak = calculatePeakRunoff(catchment, rainfallIntensity);
  
  // 初始化一个空数组，用于存放过程线数据
  const hydrograph = [];
  // 过程线的结束时间 = 降雨持续时间 + 汇流时间 (雨停后还需要一段时间水才能流完)
  const endTime = stormDuration + tc;
  
  // 循环遍历从0到结束时间的每一分钟
  for (let t = 0; t <= endTime; t += 1) {
    let flow = 0; // 初始化当前时刻的流量为0
    
    // 情况1：降雨持续时间大于或等于汇流时间 (会达到理论峰值)
    if (stormDuration >= tc) {
      if (t <= tc) {
        // 阶段A：从降雨开始到汇流时间，流量线性增加
        flow = qPeak * (t / tc);
      } else if (t <= stormDuration) {
        // 阶段B：从汇流时间到降雨结束，流量保持在峰值
        flow = qPeak;
      } else {
        // 阶段C：降雨结束后，流量线性衰减到0
        flow = qPeak * (1 - (t - stormDuration) / tc);
      }
    } 
    // 情况2：降雨持续时间小于汇流时间 (无法达到理论峰值)
    else {
      // 计算实际能达到的峰值流量 (按比例折减)
      const actualPeak = qPeak * (stormDuration / tc);
      if (t <= stormDuration) {
        // 阶段A：降雨期间，流量线性增加
        flow = actualPeak * (t / stormDuration);
      } else if (t <= tc) {
        // 阶段B：雨停后到汇流时间，简化处理为流量保持在实际峰值
        flow = actualPeak; 
      } else {
        // 阶段C：汇流时间之后，流量线性衰减到0
        flow = actualPeak * (1 - (t - tc) / stormDuration);
      }
    }
    
    // 将计算出的时间和流量（确保流量不小于0）存入数组
    hydrograph.push({ time: t, flow: Math.max(0, flow) });
  }
  
  // 返回生成的过程线数据
  return hydrograph;
}
