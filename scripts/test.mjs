import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('.test-output',{recursive:true});
for(const name of ['policy','projects','services','local','companion','workspace','runner-state','runner-completion']){
 await build({entryPoints:[`tests/${name}.test.ts`],outfile:`.test-output/${name}.mjs`,bundle:true,platform:'node',format:'esm',alias:{'cloudflare:workers':'./tests/fixtures/runtime.ts','next/headers':'./tests/fixtures/runtime.ts','next/navigation':'./tests/fixtures/runtime.ts','next/server':'./tests/fixtures/runtime.ts'}});
}
const result=spawnSync(process.execPath,['--test','.test-output/policy.mjs','.test-output/projects.mjs','.test-output/services.mjs','.test-output/local.mjs','.test-output/companion.mjs','.test-output/workspace.mjs','.test-output/runner-state.mjs','.test-output/runner-completion.mjs','tests/companion-bridge.test.mjs','tests/companion-realtime.test.mjs','tests/companion-preview.test.mjs'],{stdio:'inherit'});
process.exit(result.status??1);
