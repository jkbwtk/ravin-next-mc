import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Director } from '#/Director';
import { ResourceDepot } from '#/ResourceDepot';
import { patchBlockMaterialTypes, patchMaterials } from '#/patches';
import { Config } from '#/types/Config';

const configJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'config.json'), 'utf-8'),
);

const { success, data: config } = Config.safeParse(configJson);

if (success) {
  patchMaterials();
  patchBlockMaterialTypes();

  const director = new Director({
    credentialDepot: new ResourceDepot(config.credentials),

    hostname: config.hostname,
    port: config.port,

    loopInterval: config.loopInterval,
  });

  director.start();
}
