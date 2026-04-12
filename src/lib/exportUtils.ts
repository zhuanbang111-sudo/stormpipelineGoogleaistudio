import proj4 from 'proj4';
import { saveAs } from 'file-saver';
import { Node, Link, Catchment, SimulationResult } from '../types';

// 定义 CGCS2000 / 3-degree Gauss-Kruger zone 38 (中央经线 114E)
// EPSG:4526
const CGCS2000_GK_38 = '+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=38500000 +y_0=0 +ellps=GRS80 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

/**
 * 将 WGS84 经纬度转换为 CGCS2000 投影坐标
 */
export function convertToCGCS2000(lng: number, lat: number): [number, number] {
  try {
    return proj4(WGS84, CGCS2000_GK_38, [lng, lat]);
  } catch (error) {
    console.error('Coordinate conversion error:', error);
    return [0, 0];
  }
}

/**
 * 生成 DXF 文件内容
 */
export function generateDXF(nodes: Node[], links: Link[], catchments: Catchment[]): string {
  let dxf = '  0\nSECTION\n  2\nHEADER\n  0\nENDSEC\n';
  
  // TABLES Section (Layers)
  dxf += '  0\nSECTION\n  2\nTABLES\n  0\nTABLE\n  2\nLAYER\n';
  const layers = ['NODES', 'PIPES', 'CATCHMENTS', 'LABELS'];
  layers.forEach(layer => {
    dxf += `  0\nLAYER\n  2\n${layer}\n 70\n0\n 62\n7\n  6\nCONTINUOUS\n`;
  });
  dxf += '  0\nENDTAB\n  0\nENDSEC\n';

  // ENTITIES Section
  dxf += '  0\nSECTION\n  2\nENTITIES\n';

  // 1. 导出节点 (Nodes)
  nodes.forEach(node => {
    const [x, y] = convertToCGCS2000(node.lng, node.lat);
    // 画一个圆表示节点
    dxf += `  0\nCIRCLE\n  8\nNODES\n 10\n${x}\n 20\n${y}\n 30\n0.0\n 40\n1.0\n`;
    // 添加名称标签
    dxf += `  0\nTEXT\n  8\nLABELS\n 10\n${x + 1}\n 20\n${y + 1}\n 30\n0.0\n 40\n1.5\n  1\n${node.name}\n`;
  });

  // 2. 导出管线 (Links)
  links.forEach(link => {
    const fromNode = nodes.find(n => n.id === link.fromNodeId);
    const toNode = nodes.find(n => n.id === link.toNodeId);
    if (fromNode && toNode) {
      const [x1, y1] = convertToCGCS2000(fromNode.lng, fromNode.lat);
      const [x2, y2] = convertToCGCS2000(toNode.lng, toNode.lat);
      dxf += `  0\nLINE\n  8\nPIPES\n 10\n${x1}\n 20\n${y1}\n 30\n0.0\n 11\n${x2}\n 21\n${y2}\n 31\n0.0\n`;
    }
  });

  // 3. 导出汇水区 (Catchments)
  catchments.forEach(c => {
    if (c.polygon && c.polygon.length > 0) {
      dxf += `  0\nLWPOLYLINE\n  8\nCATCHMENTS\n 90\n${c.polygon.length}\n 70\n1\n`; // 70=1 表示闭合
      c.polygon.forEach(point => {
        const [x, y] = convertToCGCS2000(point[1], point[0]); // point is [lat, lng]
        dxf += ` 10\n${x}\n 20\n${y}\n`;
      });
    }
  });

  dxf += '  0\nENDSEC\n  0\nEOF\n';
  return dxf;
}

/**
 * 导出 DXF 文件
 */
export function exportToDXF(nodes: Node[], links: Link[], catchments: Catchment[]) {
  const content = generateDXF(nodes, links, catchments);
  const blob = new Blob([content], { type: 'application/dxf' });
  saveAs(blob, `StormFlow_Export_${new Date().toISOString().slice(0, 10)}.dxf`);
}

/**
 * 生成并导出水力分析报告 (CSV 格式)
 */
export function exportReport(
  nodes: Node[], 
  links: Link[], 
  catchments: Catchment[], 
  result: SimulationResult | null
) {
  if (!result) {
    alert('请先运行模拟以生成报告数据。');
    return;
  }

  let csvContent = '\uFEFF'; // UTF-8 BOM

  // 1. 节点报告
  csvContent += '--- 节点水力分析报告 ---\n';
  csvContent += '名称,类型,地面标高,管底标高,总汇水面积(ha),降雨历时(min),水头(m),水深(m),状态\n';
  nodes.forEach(n => {
    const res = result.nodeResults[n.id];
    const groundElev = n.elevation + n.maxDepth;
    csvContent += `${n.name},${n.type},${groundElev.toFixed(2)},${n.elevation.toFixed(2)},${res?.totalArea.toFixed(2) || 0},${res?.travelTime.toFixed(2) || 0},${res?.head.toFixed(2) || 0},${res?.depth.toFixed(2) || 0},${res?.flooded ? '溢流' : '正常'}\n`;
  });

  csvContent += '\n\n';

  // 2. 管线报告
  csvContent += '--- 管线水力分析报告 ---\n';
  csvContent += '名称,长度(m),管径(mm),坡度(‰),流量(m3/s),流速(m/s),最大能力(m3/s),推荐管径(mm),推荐流速(m/s),状态\n';
  links.forEach(l => {
    const res = result.linkResults[l.id];
    csvContent += `${l.name},${l.length},${l.diameter},${(res?.slope * 1000).toFixed(2)},${res?.flow.toFixed(3)},${res?.velocity.toFixed(2)},${res?.capacity.toFixed(3)},${res?.recommendedDiameter},${res?.recommendedVelocity.toFixed(2)},${res?.surcharge ? '满管' : '正常'}\n`;
  });

  csvContent += '\n\n';

  // 3. 汇水区报告
  csvContent += '--- 汇水区报告 ---\n';
  csvContent += '名称,面积(ha),地面种类,径流系数,地面集水时间(min),汇流节点\n';
  catchments.forEach(c => {
    const outletNode = nodes.find(n => n.id === c.outletNodeId);
    csvContent += `${c.name},${c.area.toFixed(2)},${c.surfaceType || '未指定'},${c.runoffCoefficient.toFixed(2)},${c.timeOfConcentration},${outletNode?.name || '未知'}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `Hydraulic_Report_${new Date().toISOString().slice(0, 10)}.csv`);
}
