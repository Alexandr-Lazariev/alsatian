import { ITestFixture, ITest, ITestCase } from "./_interfaces";
import { FileRequirer } from "./_core";
import { TestFixture, METADATA_KEYS } from "./alsatian-core";

export class TestLoader {

   public constructor(private _fileRequirer: FileRequirer) { }

   loadTestFixture(filePath: string): Array<ITestFixture> {
      let Test = this._fileRequirer.require(filePath);
      let testFixtureKeys = Object.keys(Test);
      let testFixtures: Array<ITestFixture> = [];

      // if the default export is class constructor
      if (typeof Test === "function") {
         let testFixture = this._loadTestFixture(Test, Test.name);
         if (testFixture !== null) {
            testFixtures.push(testFixture);
         }
      }
      // otherwise there are multiple exports and we must handle all of them
      else {
         testFixtureKeys.forEach(testFixtureKey => {
            if (typeof Test[testFixtureKey] === "function") {
               let testFixture = this._loadTestFixture(Test[testFixtureKey], testFixtureKey);
               if (testFixture !== null) {
                  testFixtures.push(testFixture);
               }
            }
         });
      }

      return testFixtures;
   }

   private _loadTestFixture(testFixtureConstructor: any, name: string): ITestFixture {
      let testFixture = new TestFixture(name);

      testFixture.ignored = false;

      if (Reflect.getMetadata(METADATA_KEYS.IGNORE, testFixtureConstructor)) {
         // fixture should be ignored
         testFixture.ignored = true;

         testFixture.ignoreReason = Reflect.getMetadata(METADATA_KEYS.IGNORE_REASON, testFixtureConstructor);
      }

      // create an instance of the test fixture
      testFixture.fixture = new testFixtureConstructor();

      // find all the tests on this test fixture
      let tests = Reflect.getMetadata(METADATA_KEYS.TESTS, testFixture.fixture);

      testFixture.focussed = false;

      if (Reflect.getMetadata(METADATA_KEYS.FOCUS, testFixtureConstructor)) {
         testFixture.focussed = true;
      }

      if (tests === undefined) {
         // no tests on the fixture
         return null;
      }

      tests.forEach((test: ITest) => {

         // the test is ignored if the fixture is, or if it's specifically ignored
         test.ignored = false;
         if (testFixture.ignored || Reflect.getMetadata(METADATA_KEYS.IGNORE, testFixture.fixture, test.key)) {
            test.ignored = true;

            // individual test ignore reasons take precedence over test fixture ignore reasons
            test.ignoreReason = Reflect.getMetadata(METADATA_KEYS.IGNORE_REASON, testFixture.fixture, test.key) || testFixture.ignoreReason;
         }

         test.focussed = false;

         if (Reflect.getMetadata(METADATA_KEYS.FOCUS, testFixture.fixture, test.key)) {
            test.focussed = true;
         }

         test.timeout = Reflect.getMetadata(METADATA_KEYS.TIMEOUT, testFixture.fixture, test.key) || null;

         testFixture.addTest(test);

         if (!test.description) {
            test.description = test.key;
         }

         let testCases = Reflect.getMetadata(METADATA_KEYS.TEST_CASES, testFixture.fixture, test.key);
         test.testCases = [];

         if (!testCases) {
            test.testCases.push({ arguments: [] });
         }
         else {
            testCases.forEach((testCase: ITestCase) => {
               test.testCases.push(testCase);
            });
         }
      });

      return testFixture;
   }
}
