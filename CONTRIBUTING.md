# Contributing to openHAB VS Code Extension

In order to join our forces here, you'd need a few things to get started:

- [Node.js](https://nodejs.org/en/download/) installed
- [Visual Studio Code](https://code.visualstudio.com/) installed
- [TypeScript](https://www.typescriptlang.org/docs/home.html) knowledge
- [Visual Studio Code Extension Authoring](https://code.visualstudio.com/api) knowledge

## Reporting Issues

Please report [openHAB VS Code Extension specific issues here](https://github.com/openhab/openhab-vscode/issues),
while issues that are related to *openHAB2 addons* or *openHAB Core* should be reported in the
[openHAB2 GitHub repository](https://github.com/openhab/openhab2-addons/issues) or the
[openHAB Core GitHub repository](https://github.com/openhab/openhab-core), respectively.
Do not worry, if you are not clear, which category your issue belongs to - we will
redirect you, if necessary.

## What's in the folder

- This folder contains all of the files necessary for the extension

- `package.json` - this is the manifest file in which most declarations for the extension capabilities are done.
It defines which commands get registered for the extension, which languages get provided, which views are distributed to vscode,...
For most new added features an adaption of package-json will be needed.

- In the `client` folder you can find everything related to features that are available for the user.

- In the `serverJS` folder you can find the implementation of our local language server, which communicates with client part in background.

- `client/src/extension.ts` - this is the main extension entry file where you will provide implementations regarding user features like code completion and Item/Things View are.
The file exports one function, `activate`, which is called the very first time your extension is
activated (in this case by executing the command). Inside the `activate` function we call `registerCommand`.
We pass the function containing the implementation of the command as the second parameter to
`registerCommand`.

- `snippets` provides autopcompletion snippets which add predefined templates in the editor

- `meta` holds some metadata like the langauage definition that is needed for syntax highlighting

- `.azure-pipelines` holds the configuration we are using for our *continous integration*.
You can find our builds and artifacts on https://dev.azure.com/openhab/vscode-openhab/_build?definitionId=2

- `webpack`: We use webpack for bundling this extension. The config is shared over different locations. It has a shared part in the repository root which is then used by specific parts for each sub package. In this case `client` and `serverJS` have their own webpack config files.

## Get up and running straight away

- Clone your fork of this repository
- (Optionally) create a new branch addressing an [open issue](https://github.com/openhab/openhab-vscode/issues)
- From the command line run `code` in the project folder
- Press `F5` to open a new window with your extension loaded
- In the new window (`[Extension Development Host]` in the title) open your openHAB config folder
- Set breakpoints in your code inside `src/extension.ts` to debug your extension
- Find output from your extension in the debug console

## Make changes

- You can relaunch the extension from the debug toolbar after changing code in `src/extension.ts`
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes

## Explore the API

- You can open the full set of our API when you open the file `node_modules/vscode/vscode.d.ts`

## Run tests

- Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Launch Tests`
- Press `F5` to run the tests in a new window with your extension loaded
- See the output of the test result in the debug console
- **TBD** Make changes to `test/extension.test.ts` or create new test files inside the `test` folder
    - By convention, the test runner will only consider files matching the name pattern `**.test.ts`
    - You can create folders inside the `test` folder to structure your tests any way you want


## Contribution guidelines

### Pull requests are always welcome

We are always thrilled to receive pull requests, and do our best to
process them as fast as possible. Not sure if that typo is worth a pull
request? Do it! We will appreciate it.

If your pull request is not accepted on the first try, don't be
discouraged! If there's a problem with the implementation, hopefully you
received feedback on what to improve.

We're trying very hard to keep openHAB lean and focused. We don't want it
to do everything for everybody. This means that we might decide against
incorporating a new feature. However, there might be a way to implement
that feature *on top of* openHAB.

### Discuss your design on the mailing list

We recommend discussing your plans [in the discussion forum](https://community.openhab.org/c/organisation/code)
before starting to code - especially for more ambitious contributions.
This gives other contributors a chance to point you in the right
direction, give feedback on your design, and maybe point out if someone
else is working on the same thing.

### Create issues...

Any significant improvement should be documented as [a GitHub
issue](https://github.com/openhab/openhab-vscode/issues?labels=enhancement&page=1&state=open) before anybody
starts working on it.

### ...but check for existing issues first!

Please take a moment to check that an issue doesn't already exist
documenting your bug report or improvement proposal. If it does, it
never hurts to add a quick "+1" or "I have this problem too". This will
help prioritize the most common problems and requests.

### Conventions

Fork the repo and make changes on your fork in a feature branch:

- If it's a bugfix branch, name it XXX-something where XXX is the number of the
  issue
- If it's a feature branch, create an enhancement issue to announce your
  intentions, and name it XXX-something where XXX is the number of the issue.

Submit unit tests for your changes.  openHAB has a great test framework built in; use
it! Take a look at existing tests for inspiration. Run the full test suite on
your branch before submitting a pull request.

Update the documentation when creating or modifying features. Test
your documentation changes for clarity, concision, and correctness, as
well as a clean documentation build.

Write clean code. Universally formatted code promotes ease of writing, reading,
and maintenance.

Pull requests descriptions should be as clear as possible and include a
reference to all the issues that they address.

Pull requests must not contain commits from other users or branches.

Commit messages must start with a capitalized and short summary (max. 50
chars) written in the imperative, followed by an optional, more detailed
explanatory text which is separated from the summary by an empty line.

Code review comments may be added to your pull request. Discuss, then make the
suggested modifications and push additional commits to your feature branch. Be
sure to post a comment after pushing. The new commits will show up in the pull
request automatically, but the reviewers will not be notified unless you
comment.

Before the pull request is merged, make sure that you squash your commits into
logical units of work using `git rebase -i` and `git push -f`. After every
commit the test suite should be passing. Include documentation changes in the
same commit so that a revert would remove all traces of the feature or fix.

Commits that fix or close an issue should include a reference like `Closes #XXX`
or `Fixes #XXX`, which will automatically close the issue when merged.

Add your name to the AUTHORS file, but make sure the list is sorted and your
name and email address match your git configuration. The AUTHORS file is
regenerated occasionally from the git commit history, so a mismatch may result
in your changes being overwritten.

### Merge approval

openHAB maintainers use LGTM (Looks Good To Me) in comments on the code review
to indicate acceptance.

A change requires LGTMs from an absolute majority of the maintainers of each
component affected. For example, if a change affects `docs/` and `addons/`, it
needs an absolute majority from the maintainers of `docs/` AND, separately, an
absolute majority of the maintainers of `addons/`.

### Sign your work

The sign-off is a simple line at the end of the explanation for the
patch, which certifies that you wrote it or otherwise have the right to
pass it on as an open-source patch.  The rules are pretty simple: if you
can certify the below (from
[developercertificate.org](http://developercertificate.org/)):

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
660 York Street, Suite 102,
San Francisco, CA 94110 USA

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.


Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

then you just add a line to every git commit message:

    Signed-off-by: Joe Smith <joe.smith@email.com> (github: github_handle)

using your real name (sorry, no pseudonyms or anonymous contributions.)

One way to automate this, is customise your get ``commit.template`` by adding
a ``prepare-commit-msg`` hook to your openHAB checkout:

```
curl -L -o .git/hooks/prepare-commit-msg https://raw.github.com/openhab/openhab2/master/contrib/prepare-commit-msg.hook && chmod +x .git/hooks/prepare-commit-msg
```

- Note: the above script expects to find your GitHub user name in ``git config --get github.user``

#### Small patch exception

There are several exceptions to the signing requirement. Currently these are:

- Your patch fixes spelling or grammar errors.
- Your patch is a single line change to documentation.

### How can I become a maintainer?

- Step 1: learn the component inside out
- Step 2: make yourself useful by contributing code, bugfixes, support etc.
- Step 3: volunteer on [the discussion group](https://community.openhab.org/c/organisation/code) or on [GitHub](https://github.com/openhab/openhab-vscode/issues?labels=question&page=1&state=open)

Don't forget: being a maintainer is a time investment. Make sure you will have time to make yourself available.
You don't have to be a maintainer to make a difference on the project!

## Community Guidelines

We want to keep the openHAB community awesome, growing and collaborative. We
need your help to keep it that way. To help with this we've come up with some
general guidelines for the community as a whole:

- Be nice: Be courteous, respectful and polite to fellow community members: no
  regional, racial, gender, or other abuse will be tolerated. We like nice people
  way better than mean ones!

- Encourage diversity and participation: Make everyone in our community
  feel welcome, regardless of their background and the extent of their
  contributions, and do everything possible to encourage participation in
  our community.

- Keep it legal: Basically, don't get us in trouble. Share only content that
  you own, do not share private or sensitive information, and don't break the
  law.

- Stay on topic: Make sure that you are posting to the correct channel
  and avoid off-topic discussions. Remember when you update an issue or
  respond to an email you are potentially sending to a large number of
  people.  Please consider this before you update.  Also remember that
  nobody likes spam.

## Attributions

The following icons were used from [Material Design Iconset](material.io/icons/) (available under the Apache License Version 2.0):

| Item type | Icon name |
|--|--|
| Color | `ic_format_color_fill_black_24px` |
| Contact | `ic_flip_black_24px` |
| DateTime | `ic_access_time_black_24px` |
| Dimmer | `ic_brightness_medium_black_24px` |
| Switch | `ic_radio_button_checked_black_24px` |
| String | `ic_view_headline_black_24px` |
| Group | `ic_folder_open_black_24px` |
| Number | `ic_dialpad_black_24px` |
| Player | `ic_play_circle_outline_black_24px` |
| Rollershutter | `ic_line_weight_black_24px` |
