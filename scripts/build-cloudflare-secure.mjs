#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import nextEnvironment from "@next/env";

const { loadEnvConfig, resetEnv } = nextEnvironment;
const require = createRequire(import.meta.url);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const nextDirectory = join(projectRoot, ".next");
const openNextDirectory = join(projectRoot, ".open-next");
const nextCacheDirectory = join(nextDirectory, "cache");
const wranglerConfigPath = join(projectRoot, "wrangler.jsonc");

const requiredBuildSecrets = [
  "TMDB_ACCESS_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const requiredProductionVariables = [
  "EMAIL_FROM",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "TMDB_BASE_URL",
];

const buildFailureMarkers = [
  "Failed to fetch spotlight data",
  "Sitemap generation failed",
  "TMDB access token is not configured",
  "TMDB discover failed",
  "supabaseKey is required",
];

let redactionValues = [];

function parseJsonc(source) {
  let withoutComments = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inString) {
      withoutComments += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      withoutComments += character;
      continue;
    }

    if (character === "/" && nextCharacter === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      withoutComments += "\n";
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index += 2;
      while (
        index < source.length &&
        !(source[index] === "*" && source[index + 1] === "/")
      ) {
        if (source[index] === "\n") withoutComments += "\n";
        index += 1;
      }
      index += 1;
      continue;
    }

    withoutComments += character;
  }

  let result = "";
  inString = false;
  escaped = false;

  for (let index = 0; index < withoutComments.length; index += 1) {
    const character = withoutComments[index];

    if (inString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      result += character;
      continue;
    }

    if (character === ",") {
      let lookahead = index + 1;
      while (/\s/.test(withoutComments[lookahead] ?? "")) lookahead += 1;
      if (["}", "]"].includes(withoutComments[lookahead])) continue;
    }

    result += character;
  }

  return JSON.parse(result);
}

function isSensitiveName(name) {
  return /(SECRET|TOKEN|PASSWORD|PRIVATE|SERVICE_ROLE|DATABASE_URL|API_KEY|CREDENTIAL)/i.test(
    name,
  );
}

function redact(output) {
  let sanitized = output ?? "";
  for (const value of redactionValues) {
    if (value.length >= 4) sanitized = sanitized.split(value).join("[REDACTED]");
  }
  return sanitized;
}

function run(command, args, { env, label, failOn = [] } = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    shell: false,
    windowsHide: true,
  });

  const stdout = redact(result.stdout);
  const stderr = redact(result.stderr);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label ?? command} failed with exit code ${result.status}.`);
  }

  const combinedOutput = `${stdout}\n${stderr}`;
  const marker = failOn.find((candidate) => combinedOutput.includes(candidate));
  if (marker) {
    throw new Error(`${label ?? command} emitted a fatal build marker: ${marker}`);
  }

  return combinedOutput;
}

function capture(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed.`);
  return result.stdout.trim();
}

function packageBinary(packageName, binaryName) {
  let packageDirectory = dirname(require.resolve(packageName));
  let packageJsonPath;
  let packageJson;

  while (true) {
    const candidate = join(packageDirectory, "package.json");
    if (existsSync(candidate)) {
      const metadata = JSON.parse(readFileSync(candidate, "utf8"));
      if (metadata.name === packageName) {
        packageJsonPath = candidate;
        packageJson = metadata;
        break;
      }
    }

    const parent = dirname(packageDirectory);
    if (parent === packageDirectory) {
      throw new Error(`Unable to locate package metadata: ${packageName}`);
    }
    packageDirectory = parent;
  }

  const relativeBinary =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[binaryName];
  if (!relativeBinary) throw new Error(`Required package binary is missing: ${binaryName}`);
  return resolve(dirname(packageJsonPath), relativeBinary);
}

function assertCleanWorktree(stage) {
  const status = capture("git", ["status", "--porcelain", "--untracked-files=all"]);
  if (status) {
    throw new Error(`Refusing secure build: Git worktree is not clean (${stage}).`);
  }
}

function productionVariables() {
  const config = parseJsonc(readFileSync(wranglerConfigPath, "utf8"));
  if (!config.vars || typeof config.vars !== "object") {
    throw new Error("wrangler.jsonc does not define production vars.");
  }

  const variables = Object.fromEntries(
    Object.entries(config.vars).map(([name, value]) => [name, String(value)]),
  );

  for (const name of requiredProductionVariables) {
    if (!variables[name]) throw new Error(`Missing required production variable: ${name}`);
  }

  for (const name of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BASE_URL"]) {
    const url = new URL(variables[name]);
    if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) {
      throw new Error(`${name} is not a production HTTPS URL.`);
    }
  }

  if (!config.name) throw new Error("wrangler.jsonc does not define a Worker name.");
  return { config, variables };
}

function listEnvironmentFiles() {
  return readdirSync(projectRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && (entry.name === ".env" || entry.name.startsWith(".env.")),
    )
    .map((entry) => entry.name)
    .sort();
}

export function withIsolatedEnvironmentFiles(callback) {
  const environmentFiles = listEnvironmentFiles();
  const stashDirectory = mkdtempSync(join(tmpdir(), "watchedthis-build-env-"));
  const movedFiles = [];

  try {
    for (const name of environmentFiles) {
      renameSync(join(projectRoot, name), join(stashDirectory, name));
      movedFiles.push(name);
    }

    if (listEnvironmentFiles().length !== 0) {
      throw new Error("Environment-file isolation failed.");
    }

    return callback();
  } catch (error) {
    throw error;
  } finally {
    const restoreErrors = [];
    for (const name of movedFiles.reverse()) {
      try {
        renameSync(join(stashDirectory, name), join(projectRoot, name));
      } catch (error) {
        restoreErrors.push(`${name}: ${error.message}`);
      }
    }
    if (restoreErrors.length > 0) {
      throw new Error(
        `Environment restoration failed for ${restoreErrors.length} file(s); ` +
          `the recovery stash was preserved at ${stashDirectory}.`,
      );
    }
    rmSync(stashDirectory, { recursive: true, force: true });
  }
}

function collectFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  visit(root);
  return files;
}

function credentialForms(value) {
  const base64 = Buffer.from(value, "utf8").toString("base64");
  return [
    value,
    encodeURIComponent(value),
    base64,
    base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"),
  ].filter((candidate, index, all) => candidate.length >= 4 && all.indexOf(candidate) === index);
}

function scanTree(root, sensitiveEntries, label) {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`${label} output directory is missing.`);
  }

  const files = collectFiles(root);
  const forms = sensitiveEntries.flatMap(([, value]) => credentialForms(value));
  let matches = 0;
  let environmentFiles = 0;

  for (const file of files) {
    if (/^\.env(?:\.|$)/.test(basename(file))) environmentFiles += 1;
    const content = readFileSync(file);
    for (const form of forms) {
      if (content.includes(Buffer.from(form, "utf8"))) matches += 1;
    }
  }

  if (environmentFiles > 0) {
    throw new Error(`${label} contains ${environmentFiles} secret-style environment file(s).`);
  }
  if (matches > 0) {
    throw new Error(`${label} contains ${matches} potential credential occurrence(s).`);
  }

  console.log(`${label} credential scan: 0 matches across ${files.length} files.`);
}

function verifyCompiledEnvironment(loadedKeys) {
  const compiledEnvironment = join(openNextDirectory, "cloudflare", "next-env.mjs");
  if (!existsSync(compiledEnvironment)) {
    throw new Error("OpenNext compiled environment module is missing.");
  }

  const content = readFileSync(compiledEnvironment, "utf8");
  const presentKeys = loadedKeys.filter((key) => content.includes(JSON.stringify(key)));
  if (presentKeys.length > 0) {
    throw new Error(
      `OpenNext serialized ${presentKeys.length} project environment key(s).`,
    );
  }
}

function verifyPrerenderedContent() {
  const homepagePath = join(nextDirectory, "server", "app", "index.html");
  const personPath = join(nextDirectory, "server", "app", "person.html");
  const sitemapPath = join(nextDirectory, "server", "app", "sitemap.xml.body");

  for (const path of [homepagePath, personPath, sitemapPath]) {
    if (!existsSync(path)) throw new Error(`Required prerendered output is missing: ${relative(projectRoot, path)}`);
  }

  const homepage = readFileSync(homepagePath, "utf8");
  const person = readFileSync(personPath, "utf8");
  const sitemap = readFileSync(sitemapPath, "utf8");
  const sitemapEntries = (sitemap.match(/<url>/g) ?? []).length;

  if (homepage.includes("Failed to load spotlight content") || !homepage.includes("image.tmdb.org")) {
    throw new Error("Homepage spotlight prerendering is not populated.");
  }
  if (!person.includes("image.tmdb.org") || !person.includes("/person/")) {
    throw new Error("Person-page prerendering is not populated.");
  }
  if (sitemapEntries < 12) {
    throw new Error(`Sitemap baseline regressed to ${sitemapEntries} entries.`);
  }

  console.log(`Prerender verification passed; sitemap entries: ${sitemapEntries}.`);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

function buildEnvironments(variables) {
  const originalEnvironment = { ...process.env };
  const silentLogger = { info() {}, error() {} };
  const loaded = loadEnvConfig(projectRoot, false, silentLogger, true);
  const parsedEnvironment = loaded.parsedEnv ?? {};
  const loadedKeys = new Set(Object.keys(parsedEnvironment));
  for (const file of loaded.loadedEnvFiles ?? []) {
    for (const key of Object.keys(file.env ?? {})) loadedKeys.add(key);
  }

  const buildEnvironment = {
    ...originalEnvironment,
    ...parsedEnvironment,
    ...variables,
    NEXT_PRIVATE_STANDALONE: "true",
    NEXT_PRIVATE_OUTPUT_TRACE_ROOT: projectRoot,
  };
  delete buildEnvironment.__NEXT_PROCESSED_ENV;
  resetEnv();

  for (const name of requiredBuildSecrets) {
    if (!buildEnvironment[name]) throw new Error(`Missing required build credential: ${name}`);
  }

  const publicNames = new Set(Object.keys(variables));
  const nextBuildControls = new Set([
    "NEXT_PRIVATE_STANDALONE",
    "NEXT_PRIVATE_OUTPUT_TRACE_ROOT",
  ]);
  const sensitiveNames = new Set([
    ...[...loadedKeys].filter((name) => !publicNames.has(name)),
    ...requiredBuildSecrets,
  ]);

  // The build only receives project credentials. Unrelated host/CI tokens are
  // neither needed for prerendering nor allowed to enter the build process.
  for (const name of Object.keys(buildEnvironment)) {
    if (
      !publicNames.has(name) &&
      !sensitiveNames.has(name) &&
      !nextBuildControls.has(name) &&
      isSensitiveName(name)
    ) {
      delete buildEnvironment[name];
    }
  }
  const sensitiveEntries = [...sensitiveNames]
    .map((name) => [name, buildEnvironment[name]])
    .filter(([, value]) => typeof value === "string" && value.length >= 4);

  redactionValues = sensitiveEntries
    .flatMap(([, value]) => credentialForms(value))
    .sort((left, right) => right.length - left.length);

  const packagingEnvironment = { ...originalEnvironment, ...variables };
  for (const name of Object.keys(packagingEnvironment)) {
    if (sensitiveNames.has(name) || (!publicNames.has(name) && isSensitiveName(name))) {
      delete packagingEnvironment[name];
    }
  }

  return {
    buildEnvironment,
    packagingEnvironment,
    sensitiveEntries,
    loadedKeys: [...loadedKeys],
  };
}

function main() {
  assertCleanWorktree("before build");
  const { config, variables } = productionVariables();
  const environments = buildEnvironments(variables);

  rmSync(nextDirectory, { recursive: true, force: true });
  rmSync(openNextDirectory, { recursive: true, force: true });

  try {
    const npmEntryPoint = environments.buildEnvironment.npm_execpath;
    if (!npmEntryPoint || !existsSync(npmEntryPoint)) {
      throw new Error("Run the secure build through npm so npm_execpath is available.");
    }
    run(process.execPath, [npmEntryPoint, "run", "build"], {
      env: environments.buildEnvironment,
      label: "Next.js standalone build",
      failOn: buildFailureMarkers,
    });

    const standalone = join(nextDirectory, "standalone");
    if (!existsSync(standalone)) throw new Error("Next.js standalone output is missing.");
    verifyPrerenderedContent();

    withIsolatedEnvironmentFiles(() => {
      run(
        process.execPath,
        [
          packageBinary("@opennextjs/cloudflare", "opennextjs-cloudflare"),
          "build",
          "--skipNextBuild",
        ],
        {
          env: environments.packagingEnvironment,
          label: "OpenNext packaging",
        },
      );
    });

    verifyCompiledEnvironment(environments.loadedKeys);
    scanTree(openNextDirectory, environments.sensitiveEntries, "OpenNext artifact");

    const dryRunDirectory = mkdtempSync(join(tmpdir(), "watchedthis-wrangler-dryrun-"));
    try {
      run(
        process.execPath,
        [
          packageBinary("wrangler", "wrangler"),
          "versions",
          "upload",
          "--dry-run",
          "--upload-source-maps",
          "--outdir",
          dryRunDirectory,
          "--name",
          String(config.name),
          "--message",
          "Secure local build validation only",
        ],
        { env: environments.packagingEnvironment, label: "Wrangler upload dry run" },
      );

      scanTree(dryRunDirectory, environments.sensitiveEntries, "Wrangler upload bundle");
      const workerPath = join(dryRunDirectory, "worker.js");
      const sourceMapPath = join(dryRunDirectory, "worker.js.map");
      if (!existsSync(workerPath) || !existsSync(sourceMapPath)) {
        throw new Error("Wrangler did not emit both worker.js and worker.js.map.");
      }
      console.log(`Wrangler worker SHA-256: ${sha256(workerPath)}`);
      console.log(`Wrangler source-map SHA-256: ${sha256(sourceMapPath)}`);
    } finally {
      rmSync(dryRunDirectory, { recursive: true, force: true });
    }

    assertCleanWorktree("after build");
    console.log("Secure Cloudflare build completed locally. No upload was performed.");
  } catch (error) {
    rmSync(openNextDirectory, { recursive: true, force: true });
    throw error;
  } finally {
    rmSync(nextCacheDirectory, { recursive: true, force: true });
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  try {
    main();
  } catch (error) {
    console.error(`Secure build failed: ${redact(error.message)}`);
    process.exitCode = 1;
  }
}
