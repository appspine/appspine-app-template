#!/usr/bin/env node
// Plain Node script to list template changes since a specific commit.
// Run manually: node scripts/list-template-changes.mjs <since-sha>

import { execFileSync as gitExec } from 'node:child_process';
import { argv, exit } from 'node:process';

const sinceSha = argv[2];
if (!sinceSha) {
  console.log('Usage: node scripts/list-template-changes.mjs <since-sha>');
  exit(1);
}

try {
  // Execute git log
  const logOutput = gitExec('git', ['log', '--pretty=format:%h|%s', `${sinceSha}..HEAD`], {
    encoding: 'utf8',
  }).trim();

  if (!logOutput) {
    console.log('No changes found since the specified SHA.');
    exit(0);
  }

  const commits = logOutput.split('\n').map((line) => {
    const parts = line.split('|');
    const sha = parts[0];
    const subject = parts.slice(1).join('|'); // Re-join just in case subject contains '|'
    return { sha, subject };
  });

  const replayChanges = [];
  const optionalChanges = [];

  for (const commit of commits) {
    const files = gitExec('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', commit.sha], {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    // Check if the commit only touches files in docs/ or .github/
    const isDocOrCIOnly = files.every(
      (file) => file.startsWith('docs/') || file.startsWith('.github/'),
    );

    if (isDocOrCIOnly) {
      optionalChanges.push(commit);
    } else {
      replayChanges.push(commit);
    }
  }

  console.log('==========================================');
  console.log('Template Changes checklist');
  console.log('==========================================');

  if (replayChanges.length > 0) {
    console.log('\nChanges to replay:');
    for (const c of replayChanges) {
      console.log(`- [ ] ${c.sha}: ${c.subject}`);
    }
  } else {
    console.log('\nNo code changes to replay.');
  }

  if (optionalChanges.length > 0) {
    console.log('\nDocs-and-CI-only (optional):');
    for (const c of optionalChanges) {
      console.log(`- [ ] ${c.sha}: ${c.subject}`);
    }
  }

  console.log('\n------------------------------------------');
  console.log('For each: replay into this fork and record the mapping in');
  console.log('docs/template-sync.md, or mark N/A with a reason.');
  console.log('==========================================');
} catch (error) {
  console.error('Error: Failed to fetch git history. Please check if the SHA is valid.');
  console.error(error.message);
  exit(1);
}
