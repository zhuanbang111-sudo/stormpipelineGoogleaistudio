import { useState, useCallback, useEffect } from 'react';
import { Node, Link, Catchment, ToolType, SimulationResult, BackgroundFeature } from '../types';
import { v4 as uuidv4 } from 'uuid'; // 用于生成唯一的ID
import { runSimulation, SimulationParams } from '../engine/hydraulicEngine';
import { PIPE_MATERIALS, DEFAULT_MATERIAL } from '../constants';
import { calculatePolygonArea } from '../lib/utils';
import { Delaunay } from 'd3-delaunay';

// 定义管网状态接口，包含所有的节点、管线和汇水区
export interface NetworkState {
  nodes: Node[];
  links: Link[];
  catchments: Catchment[];
  backgroundFeatures: BackgroundFeature[]; // 导入的底图要素
}

/**
 * 自定义React Hook：用于管理整个管网应用的状态
 * 包含地图数据、UI状态、撤销/重做历史记录等
 */
export function useNetworkStore() {
  // 核心数据状态：当前地图上的所有元素
  const [state, setState] = useState<NetworkState>({ nodes: [], links: [], catchments: [], backgroundFeatures: [] });
  
  // 历史记录状态：用于实现撤销(Undo)和重做(Redo)功能
  const [past, setPast] = useState<NetworkState[]>([]); // 过去的状态列表
  const [future, setFuture] = useState<NetworkState[]>([]); // 未来的状态列表（撤销后产生）
  
  // UI交互状态
  const [selectedTool, setSelectedTool] = useState<ToolType>('select'); // 当前选中的工具（如：画管线、选节点等）
  const [selectedElement, setSelectedElement] = useState<{ type: 'node' | 'link' | 'catchment', id: string } | null>(null); // 当前选中的地图元素
  
  // 绘图过程中的临时状态
  const [drawingLinkFrom, setDrawingLinkFrom] = useState<string | null>(null); // 正在绘制管线时的起点节点ID
  const [drawingCatchmentPoints, setDrawingCatchmentPoints] = useState<[number, number][]>([]); // 正在绘制汇水区时的多边形顶点坐标数组
  
  // 模拟结果状态
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null); // 存储水力模拟的计算结果
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    method: 'rational',
    mapType: 'tianditu_vec',
    rainfallIntensity: 50,
    stormDuration: 120,
    returnPeriod: 5,
    delayCoefficient: 1.0,
    region: 'western',
    formulaParams: {
      A: 2698.815,
      C: 0.593,
      b: 11.03,
      n: 0.648
    }
  });

  // 新增：默认标高设置（用于同步设置地面标高和井底标高）
  const [defaultInvertElevation, setDefaultInvertElevation] = useState<number>(100);
  const [defaultGroundElevation, setDefaultGroundElevation] = useState<number>(103);

  /**
   * 辅助函数：更新核心状态并自动保存历史记录
   * @param updater 一个函数，接收旧状态，返回新状态
   */
  const updateState = useCallback((updater: (prevState: NetworkState) => NetworkState) => {
    setState(prev => {
      const nextState = updater(prev);
      // 只有当状态真正发生改变时，才将其保存到历史记录中
      if (nextState !== prev) {
        setPast(p => [...p, prev]); // 将旧状态推入past数组
        setFuture([]); // 清空future数组（因为发生了新的操作，之前的重做历史失效）
      }
      return nextState;
    });
  }, []);

  /**
   * 撤销操作 (Undo)
   */
  const undo = useCallback(() => {
    if (past.length === 0) return; // 如果没有历史记录，则不执行任何操作
    const previous = past[past.length - 1]; // 获取上一个状态
    setPast(prev => prev.slice(0, prev.length - 1)); // 从past数组中移除上一个状态
    setFuture(prev => [state, ...prev]); // 将当前状态推入future数组（以便可以重做）
    setState(previous); // 将当前状态恢复为上一个状态
  }, [past, state]);

  /**
   * 重做操作 (Redo)
   */
  const redo = useCallback(() => {
    if (future.length === 0) return; // 如果没有可重做的记录，则不执行任何操作
    const next = future[0]; // 获取下一个状态
    setFuture(prev => prev.slice(1)); // 从future数组中移除下一个状态
    setPast(prev => [...prev, state]); // 将当前状态推入past数组
    setState(next); // 将当前状态更新为下一个状态
  }, [future, state]);

  // Initialize with sample data
  useEffect(() => {
    const n1: Node = { id: uuidv4(), type: 'manhole', lat: 22.545, lng: 114.055, elevation: 102, maxDepth: 3, name: 'MH-1' };
    const n2: Node = { id: uuidv4(), type: 'manhole', lat: 22.545, lng: 114.058, elevation: 101, maxDepth: 3, name: 'MH-2' };
    const n3: Node = { id: uuidv4(), type: 'manhole', lat: 22.543, lng: 114.058, elevation: 100, maxDepth: 3, name: 'MH-3' };
    const n4: Node = { id: uuidv4(), type: 'outfall', lat: 22.541, lng: 114.058, elevation: 98, maxDepth: 3, name: 'OF-1' };
    
    const l1: Link = { id: uuidv4(), fromNodeId: n1.id, toNodeId: n2.id, length: 250, diameter: 400, height: 400, shape: 'circular', material: DEFAULT_MATERIAL.name, roughness: DEFAULT_MATERIAL.n, name: 'P-1' };
    const l2: Link = { id: uuidv4(), fromNodeId: n2.id, toNodeId: n3.id, length: 220, diameter: 500, height: 500, shape: 'circular', material: DEFAULT_MATERIAL.name, roughness: DEFAULT_MATERIAL.n, name: 'P-2' };
    const l3: Link = { id: uuidv4(), fromNodeId: n3.id, toNodeId: n4.id, length: 220, diameter: 600, height: 600, shape: 'circular', material: DEFAULT_MATERIAL.name, roughness: DEFAULT_MATERIAL.n, name: 'P-3' };

    const c1: Catchment = {
      id: uuidv4(),
      name: 'C-1',
      area: 2.5,
      runoffCoefficient: 0.85,
      timeOfConcentration: 10,
      outletNodeId: n1.id,
      polygon: [[22.546, 114.054], [22.546, 114.056], [22.544, 114.056], [22.544, 114.054]]
    };

    setState({
      nodes: [n1, n2, n3, n4],
      links: [l1, l2, l3],
      catchments: [c1],
      backgroundFeatures: []
    });
    setPast([]);
    setFuture([]);
  }, []);

  const addNode = useCallback((lat: number, lng: number, type: 'manhole' | 'outfall' = 'manhole') => {
    let newNode: Node | null = null;
    updateState(prev => {
      newNode = {
        id: uuidv4(),
        type,
        lat,
        lng,
        elevation: defaultInvertElevation,
        maxDepth: Math.max(0, defaultGroundElevation - defaultInvertElevation),
        name: `${type === 'manhole' ? 'MH' : 'OF'}-${prev.nodes.length + 1}`
      };
      return { ...prev, nodes: [...prev.nodes, newNode] };
    });
    return newNode;
  }, [updateState, defaultInvertElevation, defaultGroundElevation]);

  /**
   * 更新现有节点的属性（如位置、标高、名称等）
   */
  const updateNode = useCallback((id: string, updates: Partial<Node>) => {
    updateState(prev => {
      // 遍历所有节点，找到目标节点并更新其属性
      const newNodes = prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
      
      let newLinks = prev.links;
      // 如果节点的位置（经纬度）发生了变化，需要重新计算与该节点相连的所有管线的长度
      if (updates.lat !== undefined || updates.lng !== undefined) {
        newLinks = prev.links.map(l => {
          // 找到起点或终点是该节点的管线
          if (l.fromNodeId === id || l.toNodeId === id) {
            const fromNode = newNodes.find(n => n.id === l.fromNodeId);
            const toNode = newNodes.find(n => n.id === l.toNodeId);
            if (fromNode && toNode) {
              // 使用半正矢公式 (Haversine formula) 计算地球上两点之间的球面距离
              const R = 6371e3; // 地球半径，单位：米
              const φ1 = fromNode.lat * Math.PI/180;
              const φ2 = toNode.lat * Math.PI/180;
              const Δφ = (toNode.lat-fromNode.lat) * Math.PI/180;
              const Δλ = (toNode.lng-fromNode.lng) * Math.PI/180;

              const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const length = Math.max(1, Math.round(R * c)); // 确保长度至少为1米，并四舍五入
              return { ...l, length }; // 返回更新了长度的管线
            }
          }
          return l; // 如果不是相连的管线，保持不变
        });
      }

      return {
        ...prev,
        nodes: newNodes,
        links: newLinks
      };
    });
  }, [updateState]);

  /**
   * 删除指定的节点，并清理与之相关的管线和汇水区连接
   */
  const deleteNode = useCallback((id: string) => {
    updateState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id), // 移除该节点
      links: prev.links.filter(l => l.fromNodeId !== id && l.toNodeId !== id), // 移除所有连接到该节点的管线
      catchments: prev.catchments.map(c => c.outletNodeId === id ? { ...c, outletNodeId: '' } : c) // 如果有汇水区排入该节点，清空其排放口设置
    }));
    // 如果被删除的节点正好是当前选中的元素，则取消选中
    if (selectedElement?.id === id) setSelectedElement(null);
  }, [updateState, selectedElement]);

  /**
   * 在两个节点之间添加一条新管线
   */
  const addLink = useCallback((fromNodeId: string, toNodeId: string) => {
    let newLink: Link | null = null;
    updateState(prev => {
      // 防止自环（起点和终点是同一个节点）
      if (fromNodeId === toNodeId) return prev;
      // 防止重复添加相同的管线（无论方向）
      if (prev.links.some(l => (l.fromNodeId === fromNodeId && l.toNodeId === toNodeId) || (l.fromNodeId === toNodeId && l.toNodeId === fromNodeId))) return prev;

      const fromNode = prev.nodes.find(n => n.id === fromNodeId);
      const toNode = prev.nodes.find(n => n.id === toNodeId);
      if (!fromNode || !toNode) return prev;

      // 使用半正矢公式计算两节点之间的距离作为管线初始长度
      const R = 6371e3; // metres
      const φ1 = fromNode.lat * Math.PI/180;
      const φ2 = toNode.lat * Math.PI/180;
      const Δφ = (toNode.lat-fromNode.lat) * Math.PI/180;
      const Δλ = (toNode.lng-fromNode.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const length = R * c;

      newLink = {
        id: uuidv4(),
        fromNodeId,
        toNodeId,
        length: Math.max(1, Math.round(length)), // 长度四舍五入
        diameter: 300, // 默认管径 300mm
        height: 300, // 默认高度 300mm
        shape: 'circular', // 默认圆形管道
        material: DEFAULT_MATERIAL.name,
        roughness: DEFAULT_MATERIAL.n, // 默认曼宁系数

        name: `P-${prev.links.length + 1}`
      };
      return { ...prev, links: [...prev.links, newLink] };
    });
    return newLink;
  }, [updateState]);

  /**
   * 更新现有管线的属性（如管径、形状、粗糙度等）
   */
  const updateLink = useCallback((id: string, updates: Partial<Link>) => {
    updateState(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  }, [updateState]);

  /**
   * 删除指定的管线
   */
  const deleteLink = useCallback((id: string) => {
    updateState(prev => ({
      ...prev,
      links: prev.links.filter(l => l.id !== id)
    }));
    // 如果被删除的管线正好是当前选中的元素，则取消选中
    if (selectedElement?.id === id) setSelectedElement(null);
  }, [updateState, selectedElement]);

  /**
   * 在地图上添加一个新的汇水区
   * @param polygon 汇水区边界的多边形顶点坐标数组
   * @param outletNodeId 汇水区雨水排入的目标节点ID
   */
  const addCatchment = useCallback((polygon: [number, number][], outletNodeId: string) => {
    let newCatchment: Catchment | null = null;
    updateState(prev => {
      // 根据多边形坐标计算真实面积
      const area = calculatePolygonArea(polygon);

      newCatchment = {
        id: uuidv4(),
        name: `C-${prev.catchments.length + 1}`, // 自动命名
        area,
        runoffCoefficient: 0.8, // 默认径流系数
        timeOfConcentration: 10, // 默认地面集水时间为 10min
        outletNodeId,
        polygon
      };
      return { ...prev, catchments: [...prev.catchments, newCatchment] };
    });
    return newCatchment;
  }, [updateState]);

  /**
   * 更新现有汇水区的属性（如面积、径流系数、边界点等）
   */
  const updateCatchment = useCallback((id: string, updates: Partial<Catchment>) => {
    updateState(prev => ({
      ...prev,
      catchments: prev.catchments.map(c => {
        if (c.id === id) {
          const newCatchment = { ...c, ...updates };
          // 如果更新了多边形且没有显式更新面积，则重新计算面积
          if (updates.polygon && updates.area === undefined) {
            newCatchment.area = calculatePolygonArea(updates.polygon);
          }
          return newCatchment;
        }
        return c;
      })
    }));
  }, [updateState]);

  /**
   * 删除指定的汇水区
   */
  const deleteCatchment = useCallback((id: string) => {
    updateState(prev => ({
      ...prev,
      catchments: prev.catchments.filter(c => c.id !== id)
    }));
    // 如果被删除的汇水区正好是当前选中的元素，则取消选中
    if (selectedElement?.id === id) setSelectedElement(null);
  }, [updateState, selectedElement]);

  /**
   * 运行水力模拟
   */
  const runSim = useCallback(() => {
    // 调用 hydraulicEngine.ts 中的 runSimulation 函数进行计算
    const result = runSimulation(state.nodes, state.links, state.catchments, simulationParams);
    // 将计算结果保存到状态中，供 UI 显示
    setSimulationResult(result);
  }, [state, simulationParams]);

  /**
   * 批量导入数据（用于处理从 CAD 或 GIS 文件导入的底图要素）
   */
  const addImportedData = useCallback((newBackgroundFeatures: BackgroundFeature[]) => {
    updateState(prev => ({
      ...prev,
      backgroundFeatures: [...prev.backgroundFeatures, ...newBackgroundFeatures] // 将新底图要素追加到现有底图要素列表中
    }));
  }, [updateState]);

  /**
   * 清空所有底图要素
   */
  const clearBackgroundFeatures = useCallback(() => {
    updateState(prev => ({
      ...prev,
      backgroundFeatures: []
    }));
  }, [updateState]);

  /**
   * 基于泰森多边形 (Voronoi) 自动为一个区域的所有 manhole 检查井节点生成相近的集水区/汇水区
   */
  const generateVoronoiCatchments = useCallback(() => {
    const targetNodes = state.nodes.filter(n => n.type === 'manhole');
    if (targetNodes.length < 3) {
      alert("自动划分汇水区需要至少 3 个检查井（Manhole）节点进行空间计算！");
      return;
    }

    try {
      // 提取所有经纬度坐标为 Delaunay 计算所需的格式：[longitude, latitude] (即 [lng, lat])
      // 为了对抗任何完全重合或直线对其的极端几何退化，添加微小的物理抗扰动 (不影响实际精度和匹配)
      const points = targetNodes.map(n => [
        n.lng + (Math.random() - 0.5) * 1e-9,
        n.lat + (Math.random() - 0.5) * 1e-9
      ] as [number, number]);

      const delaunay = Delaunay.from(points);

      // 计算现有节点的空间极大包围范围
      const lats = targetNodes.map(n => n.lat);
      const lngs = targetNodes.map(n => n.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // 根据实际分布动态计算包围边界，防止裁切过于窄斜，最小提供 0.005 度的安全边际 (约 500米)
      const latMargin = Math.max(0.005, (maxLat - minLat) * 0.4);
      const lngMargin = Math.max(0.005, (maxLng - minLng) * 0.4);

      const bounds = [
        minLng - lngMargin,
        minLat - latMargin,
        maxLng + lngMargin,
        maxLat + latMargin
      ] as [number, number, number, number];

      const voronoi = delaunay.voronoi(bounds);

      const newCatchments: Catchment[] = [];
      targetNodes.forEach((node, i) => {
        const cellPolygon = voronoi.cellPolygon(i);
        if (cellPolygon && cellPolygon.length >= 3) {
          // 将 Voronoi 的 [lng, lat] 多边形序列投影映射回组件需要的 [lat, lng]
          const polygon: [number, number][] = cellPolygon.map(pt => [pt[1], pt[0]]);
          const area = calculatePolygonArea(polygon);

          newCatchments.push({
            id: uuidv4(),
            name: `C-${node.name}`,
            area,
            runoffCoefficient: 0.8, // 预置经典下垫面雨阻系数
            timeOfConcentration: 10, // 设定典型汇水时间 10 分钟
            outletNodeId: node.id,
            polygon
          });
        }
      });

      if (newCatchments.length === 0) {
        alert("几何划分未生成有效集水单元，请确保您的检查井在地图上有一定范围的分布。");
        return;
      }

      updateState(prev => ({
        ...prev,
        catchments: newCatchments
      }));

    } catch (err: any) {
      console.error("Failed to generate Voronoi diagrams:", err);
      alert("自动化划分计算失败: " + (err.message || err));
    }
  }, [state.nodes, updateState]);

  // 返回所有状态和操作函数，供组件使用
  return {
    nodes: state.nodes, // 所有的节点数据
    links: state.links, // 所有的管线数据
    catchments: state.catchments, // 所有的汇水区数据
    backgroundFeatures: state.backgroundFeatures, // 所有的底图要素数据
    addNode, updateNode, deleteNode, // 节点操作函数
    addLink, updateLink, deleteLink, // 管线操作函数
    addCatchment, updateCatchment, deleteCatchment, // 汇水区操作函数
    addImportedData, // 导入数据函数
    clearBackgroundFeatures, // 清空底图要素函数
    generateVoronoiCatchments, // 自动生成泰森多边形汇水区
    selectedTool, setSelectedTool, // 当前工具状态及设置函数
    selectedElement, setSelectedElement, // 当前选中元素状态及设置函数
    drawingLinkFrom, setDrawingLinkFrom, // 绘制管线状态
    drawingCatchmentPoints, setDrawingCatchmentPoints, // 绘制汇水区状态
    simulationResult, runSim, // 模拟结果及运行函数
    simulationParams, setSimulationParams, // 模拟参数
    defaultInvertElevation, setDefaultInvertElevation,
    defaultGroundElevation, setDefaultGroundElevation,
    undo, redo, // 撤销和重做函数
    canUndo: past.length > 0, // 是否可以撤销（布尔值）
    canRedo: future.length > 0
  };
}
