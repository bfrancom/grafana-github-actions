"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { error as logError, getInput, setFailed } from '@actions/core'
const github_1 = require("@actions/github");
// import { EventPayloads } from '@octokit/webhooks'
// import { OctoKitIssue } from '../api/octokit'
const Action_1 = require("../common/Action");
const exec_1 = require("@actions/exec");
const git_1 = require("../common/git");
const core_1 = require("@actions/core");
class BumpVersion extends Action_1.Action {
    constructor() {
        super(...arguments);
        this.id = 'BumpVersion';
    }
    async onTriggered(octokit) {
        const { owner, repo } = github_1.context.repo;
        const token = this.getToken();
        const payload = github_1.context.payload;
        const version = payload.inputs.version;
        const version_call = (0, core_1.getInput)('version_call');
        if (!version && !version_call) {
            throw new Error('Missing version input');
        }
        await (0, git_1.cloneRepo)({ token, owner, repo });
        process.chdir(repo);
        if (version) {
            // Manually invoked the action
            const base = github_1.context.ref.substring(github_1.context.ref.lastIndexOf('/') + 1);
            await this.onTriggeredBase(octokit, base, version);
            return;
        }
        if (version_call) {
            // Action invoked by a workflow
            const matches = version_call.match(/^(\d+.\d+).\d+(?:-beta.\d+)?$/);
            if (!matches || matches.length < 2) {
                throw new Error('The input version format is not correct, please respect major.minor.patch or major.minor.patch-beta.number format. Example: 7.4.3 or 7.4.3-beta.1');
            }
            const base = `v${matches[1]}.x`;
            await this.onTriggeredBase(octokit, base, version_call);
            return;
        }
    }
    async onTriggeredBase(octokit, base, version) {
        const { owner, repo } = github_1.context.repo;
        const prBranch = `bump-version-${version}`;
        // create branch
        await git('switch', base);
        await git('switch', '--create', prBranch);
        // Update version
        await (0, exec_1.exec)('npm', ['version', version, '--no-git-tag-version']);
        await (0, exec_1.exec)('npx', [
            'lerna',
            'version',
            version,
            '--no-push',
            '--no-git-tag-version',
            '--force-publish',
            '--exact',
            '--yes',
        ]);
        try {
            //regenerate yarn.lock file
            await (0, exec_1.exec)('yarn', undefined, { env: { YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' } });
        }
        catch (e) {
            console.error('yarn failed', e);
        }
        await git('commit', '-am', `"Release: Updated versions in package to ${version}"`);
        // push
        await git('push', '--set-upstream', 'origin', prBranch);
        const body = `Executed:\n
		npm version ${version} --no-git-tag-version\n
		npx lerna version ${version} --no-push --no-git-tag-version --force-publish --exact --yes
		yarn
		`;
        await octokit.octokit.pulls.create({
            base,
            body,
            head: prBranch,
            owner,
            repo,
            title: `Release: Bump version to ${version}`,
        });
    }
}
const git = async (...args) => {
    // await exec('git', args, { cwd: repo })
    await (0, exec_1.exec)('git', args);
};
new BumpVersion().run(); // eslint-disable-line
//# sourceMappingURL=index.js.map