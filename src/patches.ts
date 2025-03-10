import mcData from 'minecraft-data';

export function patchMaterials() {
  const goodData = mcData('1.21.3');
  const badData = mcData('1.21.4');

  for (const [materialType, toolMults] of Object.entries(badData.materials)) {
    for (const toolId of Object.keys(toolMults)) {
      if (goodData.materials[materialType] === undefined) {
        continue;
      }

      const badTool = badData.items[Number(toolId)];

      if (badTool === undefined) {
        continue;
      }

      const goodTool = goodData.itemsByName[badTool.name];

      if (goodTool === undefined) {
        continue;
      }

      const goodMult = goodData.materials[materialType][goodTool.id];

      if (goodMult === undefined) {
        continue;
      }

      toolMults[toolId] = goodMult;
    }
  }
}
