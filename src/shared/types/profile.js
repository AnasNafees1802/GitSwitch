"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDER_CONFIGS = void 0;
/**
 * Provider configurations
 */
exports.PROVIDER_CONFIGS = {
    github: {
        name: 'github',
        displayName: 'GitHub',
        hostname: 'github.com',
        sshHostname: 'github.com',
        icon: 'github',
        docsUrl: 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh',
    },
    gitlab: {
        name: 'gitlab',
        displayName: 'GitLab',
        hostname: 'gitlab.com',
        sshHostname: 'gitlab.com',
        icon: 'gitlab',
        docsUrl: 'https://docs.gitlab.com/ee/user/ssh.html',
    },
    bitbucket: {
        name: 'bitbucket',
        displayName: 'Bitbucket',
        hostname: 'bitbucket.org',
        sshHostname: 'bitbucket.org',
        icon: 'bitbucket',
        docsUrl: 'https://support.atlassian.com/bitbucket-cloud/docs/set-up-an-ssh-key/',
    },
    azure: {
        name: 'azure',
        displayName: 'Azure DevOps',
        hostname: 'dev.azure.com',
        sshHostname: 'ssh.dev.azure.com',
        icon: 'azure',
        docsUrl: 'https://learn.microsoft.com/en-us/azure/devops/repos/git/use-ssh-keys-to-authenticate',
    },
    custom: {
        name: 'custom',
        displayName: 'Custom',
        hostname: '',
        sshHostname: '',
        icon: 'git',
        docsUrl: '',
    },
};
//# sourceMappingURL=profile.js.map