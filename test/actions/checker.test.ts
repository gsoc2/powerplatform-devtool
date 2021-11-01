// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { should, use } from "chai";
import { stubInterface } from "ts-sinon";
import * as sinonChai from "sinon-chai";
import rewiremock from "../rewiremock";
import { fake, restore, stub } from "sinon";
import { mockEnvironmentUrl } from "./mockData";
import { RunnerParameters, UsernamePassword } from "@microsoft/powerplatform-cli-wrapper";
import Sinon = require("sinon");
import { BuildToolsHost } from "../../src/host/BuildToolsHost";
should();
use(sinonChai);

describe("check solution test", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let checkSolutionStub: Sinon.SinonStub<any[], any>;
  let runnerParameters: RunnerParameters;
  let credentials: UsernamePassword;

  beforeEach(() => {
    checkSolutionStub = stub();
    runnerParameters = stubInterface<RunnerParameters>();
    credentials = stubInterface<UsernamePassword>();
  });
  afterEach(() => restore());

  async function callActionWithMocks(): Promise<void> {
    const checker = await rewiremock.around(
      () => import("../../src/tasks/checker/checker-v0/index"),
      (mock) => {
        mock(() => import("@microsoft/powerplatform-cli-wrapper/dist/actions")).with({ checkSolution: checkSolutionStub });
        mock(() => import("../../src/params/auth/getCredentials")).with({ getCredentials: () => credentials });
        mock(() => import("../../src/params/auth/getEnvironmentUrl")).with({ getEnvironmentUrl: () => mockEnvironmentUrl });
        mock(() => import("fs/promises")).with({ chmod: fake() });
        mock(() => import("../../src/params/runnerParameters")).with({ runnerParameters: runnerParameters });
      });
    await checker.main();
  }

  it("calls check solution", async () => {

    await callActionWithMocks();

    checkSolutionStub.should.have.been.calledOnceWithExactly({
      credentials: credentials,
      environmentUrl: mockEnvironmentUrl,
      solutionPath: { name: 'FilesToAnalyze', required: false, defaultValue: '**\\*.zip' },
      ruleLevelOverride: { name: 'RulesToOverride', required: false, defaultValue: undefined },
      outputDirectory: { name: 'ArtifactDestinationName', required: false, defaultValue: "CodeAnalysisLogs" },
    }, runnerParameters, new BuildToolsHost());
  });
});