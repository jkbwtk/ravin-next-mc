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

export function patchBlockMaterialTypes() {
  const data = mcData('1.21.4');

  for (const block of data.blocksArray) {
    if (block.material === 'incorrect_for_wooden_tool') {
      block.material = 'mineable/pickaxe';
    }
  }
}
