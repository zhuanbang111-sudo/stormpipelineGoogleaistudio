/**
 * 排水管渠粗糙系数 (Manning's n)
 * 参考《室外排水设计标准》GB50014-2021 第5.2.3条
 */
export const PIPE_MATERIALS = [
  { name: '混凝土管、钢筋混凝土管', n: 0.013, description: 'Concrete / Reinforced Concrete' },
  { name: '塑料管 (内壁光滑)', n: 0.010, description: 'Plastic (Smooth wall)' },
  { name: '铸铁管', n: 0.013, description: 'Cast Iron' },
  { name: '钢管', n: 0.012, description: 'Steel' },
  { name: '砖砌渠 (水泥砂浆抹面)', n: 0.015, description: 'Brick Masonry (Cement mortar)' },
  { name: '石砌渠 (水泥砂浆抹面)', n: 0.017, description: 'Stone Masonry (Cement mortar)' },
  { name: '土渠', n: 0.025, description: 'Earth Canal' },
];

export const DEFAULT_MATERIAL = PIPE_MATERIALS[0];

/**
 * 地面种类及径流系数
 * 参考《室外排水设计标准》GB50014-2021 表4.1.8-1 & 表4.1.8-2
 */
export const SURFACE_TYPES = [
  { name: '各种屋面、混凝土或沥青路面', coefficient: 0.85, range: '0.85~0.95' },
  { name: '大块石铺砌路面或沥青表面各种的碎石路面', coefficient: 0.60, range: '0.55~0.65' },
  { name: '级配碎石路面', coefficient: 0.45, range: '0.40~0.50' },
  { name: '干砌砖石或碎石路面', coefficient: 0.38, range: '0.35~0.40' },
  { name: '非铺砌土路面', coefficient: 0.30, range: '0.25~0.35' },
  { name: '公园或绿地', coefficient: 0.15, range: '0.10~0.20' },
  { name: '城镇建筑密集区 (综合)', coefficient: 0.65, range: '0.60~0.70' },
  { name: '城镇建筑较密集区 (综合)', coefficient: 0.53, range: '0.45~0.60' },
  { name: '城镇建筑稀疏区 (综合)', coefficient: 0.33, range: '0.20~0.45' },
];
