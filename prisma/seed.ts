import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Sanitize multiline code strings by removing common leading indentation  
 * and trimming blank lines while preserving relative indentation.
 */
function sanitizeCode(code: string): string {
  // Split into lines
  const lines = code.split('\n');

  // Remove leading and trailing blank lines
  let startIdx = 0;
  let endIdx = lines.length - 1;

  while (startIdx <= endIdx && lines[startIdx].trim() === '') {
    startIdx++;
  }

  while (endIdx >= startIdx && lines[endIdx].trim() === '') {
    endIdx--;
  }

  if (startIdx > endIdx) {
    return '';
  }

  const trimmedLines = lines.slice(startIdx, endIdx + 1);

  // Find minimum common leading whitespace (excluding blank lines)
  let minIndent = Infinity;
  for (const line of trimmedLines) {
    if (line.trim() !== '') {
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length ?? 0;
      minIndent = Math.min(minIndent, leadingSpaces);
    }
  }

  // If no common indent found, return as-is
  if (minIndent === Infinity || minIndent === 0) {
    return trimmedLines.join('\n');
  }

  // Remove common indentation from all lines and clean up blank lines
  const sanitized = trimmedLines.map((line) => {
    if (line.trim() === '') {
      return ''; // Convert blank lines to empty strings (no whitespace)
    }
    return line.length > minIndent ? line.substring(minIndent) : line.trim();
  });

  return sanitized.join('\n');
}

async function main() {
  try {
    
    console.log('🌱 Starting database seeding...');

    // await prisma.user.create({
    //   data:{
    //     username: 'admin',
    //     email: 'k240603@nu.edu.pk',
    //     password: 'admin@debugDuel',
    //     role: 'ADMIN'
    //   },
    // })

     const round = await prisma.round.create({
    data: {
      roundNumber: 1,
      name: "Phase 1 – Confrontation",
      duration: 60, // in minutes
      status: "UNLOCKED",
      weight: 30,
    },
  });

  // 2. Create a Question
  const q1 = await prisma.question.create({
    data: {
      roundId: round.id,
      title: "The Flattening Logic",
      problemStatement: sanitizeCode(`
                         You are given a 2D array grid[ROWS][COLS] representing the pixelated forest.
                         You must transfer all elements into a 1D array linear_anchor[ROWS * COLS] such that each row follows the previous one in a continuous line.`),
            },
  });
  const q2 = await prisma.question.create({
    data: {
      roundId: round.id,
      title: "Energy Signature Analysis",
      problemStatement: sanitizeCode(`
                        The Mission: Identify the Anchors The gravity in your home dimension is inverting! 
                        To ground the reality, you must identify the two strongest energy peaks (2nd Max) and the two most stable floor-values (2nd Min). 
                        Because both Kiros are present, their signatures are overlapping.`),
            },
  });
  const q3 = await prisma.question.create({
    data: {
      roundId: round.id,
      title: "Environment Lockdown Sequence",
      problemStatement: sanitizeCode(`
                          The Paradox-Verse is seconds away from total collapse.
                          As Interstellar Kiro's corrupted energy surges through the fabric of reality, the environment begins executing its last automated stabilization protocol. This protocol was designed by the Paradox-Verse itself — a failsafe that can temporarily lock reality into a stable state and prevent it from falling into the Glitch Abyss.
                          However, the system is fragile. A single misinterpretation in its logic could cause the universe to fragment permanently.
                          You are tasked with debugging the core stabilization program that determines whether the Paradox-Verse can survive this confrontation.`),
            },
  });

  // 3. Create Test Cases
  await prisma.testCase.createMany({
    data: [
      {
        questionId: q1.id,
        input: sanitizeCode(`101 102 103
201 202 203
301 302 303`),
        expectedOutput: "101 102 103 201 202 203 301 302 303",
        description: "Standard 3x3 flattening",
      },
      
    ],
  });
await prisma.testCase.createMany({
  data: [
    {
      questionId: q2.id,
      input: sanitizeCode(`5
10 20 30 40 50`),
      expectedOutput: sanitizeCode(`
2nd Max: 40
2nd Min: 20
      `),
      description: "Simple increasing sequence",
    },
    {
      questionId: q2.id,
      input: sanitizeCode(`6
89 45 89 12 67 12`),
      expectedOutput: sanitizeCode(`
2nd Max: 67
2nd Min: 45
      `),
      description: "Contains duplicates",
    },
    {
      questionId: q2.id,
      input: sanitizeCode(`5
-1 -5 -3 -10 -7`),
      expectedOutput: sanitizeCode(`
2nd Max: -3
2nd Min: -7
      `),
      description: "Negative numbers",
    },
    {
      questionId: q2.id,
      input: sanitizeCode(`6
1 2 3 4 5 6`),
      expectedOutput: sanitizeCode(`
2nd Max: 5
2nd Min: 2
      `),
      description: "Sequential numbers",
      isVisible: false,
    },
  ],
});

  await prisma.testCase.createMany({
  data: [
    {
      questionId: q3.id,
      input: sanitizeCode(`
                25000
                1
                green`),
      expectedOutput: sanitizeCode(` 
                        Initiating stabilization sequence...
                        3
                        2
                        1
                        Universe Stabilized!`),
      description: "Successful Stabilization (All Conditions Met)",
    },
    {
      questionId: q3.id,
      input: sanitizeCode(`
              15000
              1
              green`),
      expectedOutput: sanitizeCode(`
                       WARNING: System instability detected!
                       Stabilization Failed — Universe Unstable`),
      description: "Insufficient Energy Core Level",
    },
    {
      questionId: q3.id,
      input: sanitizeCode(`
              30000
              0
              green`),
      expectedOutput: sanitizeCode(`
                       WARNING: System instability detected!
                       Stabilization Failed — Universe Unstable`),
      description: "Guardian Sync Failure",
      isVisible: false
    },
  ],
});


  // 4. Create Buggy Code Snippets
  await prisma.buggyCode.createMany({
  data: [
    {
      questionId: q1.id,
      language: "C",
      code: sanitizeCode(`
        #include <stdio.h>
        int main() {
            int grid[3][3];
            int linear_anchor[9];
            int i, j, k;
            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    scanf("%d", &grid[i][j]);
                }
            }
            for (i = 0; i < 3; i++) {
                k = 0;                      
                for (j = 0; j < 2; j++) {   // still buggy
                    linear_anchor[k] = grid[i][j];
                    k++;
                }
            }
            for (i = 0; i < 9; i++) {
                printf("%d ", linear_anchor[i]);
            }
            return 0;
        }
      `),
    },
    {
      questionId: q1.id,
      language: "Cpp",
      code: sanitizeCode(`
        #include <iostream>
        using namespace std;

        int main() {
            int grid[3][3];
            int linear_anchor[9];
            int i, j, k;

            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    cin >> grid[i][j];
                }
            }

            for (i = 0; i < 3; i++) {
                k = 0;                    
                for (j = 0; j < 2; j++) { // still buggy
                    linear_anchor[k] = grid[i][j];
                    k++;
                }
            }

            for (i = 0; i < 9; i++) {
                cout << linear_anchor[i] << " ";
            }

            return 0;
        }
      `),
    },
    {
      questionId: q1.id,
      language: "Java",
      code: sanitizeCode(`
        import java.util.Scanner;
        public class BuggyFlatten {
            public static void main(String[] args) {
                Scanner sc = new Scanner(System.in);

                int[][] grid = new int[3][3];
                int[] linearAnchor = new int[9];
                int i, j, k;

                for (i = 0; i < 3; i++) {
                    for (j = 0; j < 3; j++) {
                        grid[i][j] = sc.nextInt();
                    }
                }

                for (i = 0; i < 3; i++) {
                    k = 0;                    
                    for (j = 0; j < 2; j++) { // still buggy
                        linearAnchor[k] = grid[i][j];
                        k++;
                    }
                }

                for (i = 0; i < 9; i++) {
                    System.out.print(linearAnchor[i] + " ");
                }

                sc.close();
            }
        }
      `),
    },
    {
      questionId: q1.id,
      language: "Python",
      code: sanitizeCode(`
        grid = [[0 for _ in range(3)] for _ in range(3)]
        linear_anchor = [0 for _ in range(9)]

        for i in range(3):
            for j in range(3):
                grid[i][j] = int(input())

        for i in range(3):
            k = 0                 # LOGICAL ERROR #1
            for j in range(2):    # LOGICAL ERROR #2
                linear_anchor[k] = grid[i][j]
                k += 1

        for x in linear_anchor:
            print(x, end=" ")
      `),
    },
  ],
});


  await prisma.buggyCode.createMany({
    data: [
      {
        questionId: q2.id,
        language: "C",
        code: sanitizeCode(`
                #include <stdio.h>
                int main() {
                    int n, i;
                    int arr[100];
                    int max1, max2;
                    int min1, min2;
                    scanf("%d", &n);
                    for (i = 0; i < n; i++) {
                        scanf("%d", &arr[i]);
                    }
                    max1 = max2 = arr[0];   
                    min1 = min2 = arr[0];   

                    for (i = 1; i < n; i++) {   

                        if (arr[i] > max1) {
                            max2 = max1;
                            max1 = arr[i];
                        } else if (arr[i] > max2) {   
                            max2 = arr[i];
                        }

                        if (arr[i] < min1) {
                            min2 = min1;
                            min1 = arr[i];
                        } else if (arr[i] > min2) {   
                            min2 = arr[i];
                        }
                    }

                    printf("2nd Max: %d\n", max2);
                    printf("2nd Min: %d\n", min2);

                    return 0;
                }

                `),
      },
      {
        questionId: q2.id,
        language: "Cpp",
        code: sanitizeCode(`
                #include <iostream>
                using namespace std;

                int main() {
                    int n;
                    int arr[100];
                    int max1, max2;
                    int min1, min2;

                    cin >> n;

                    for (int i = 0; i < n; i++) {
                        cin >> arr[i];
                    }

                    max1 = max2 = arr[0];   
                    min1 = min2 = arr[0];   

                    for (int i = 1; i < n; i++) {   

                        if (arr[i] > max1) {
                            max2 = max1;
                            max1 = arr[i];
                        } 
                        else if (arr[i] > max2) {   
                            max2 = arr[i];
                        }

                        if (arr[i] < min1) {
                            min2 = min1;
                            min1 = arr[i];
                        } 
                        else if (arr[i] > min2) {   
                            min2 = arr[i];
                        }
                    }

                    cout << "2nd Max: " << max2 << endl;
                    cout << "2nd Min: " << min2 << endl;

                    return 0;
                }

                `),
      },
      {
        questionId: q2.id,
        language: "Java",
        code: sanitizeCode(`
                import java.util.Scanner;
                public class BuggyFlatten {
                    public static void main(String[] args) {
                        Scanner sc = new Scanner(System.in);

                        int[][] grid = new int[10][10];
                        int[] linearAnchor = new int[100];
                        int i, j, k;

                        for (i = 0; i < 10; i++) {
                            for (j = 0; j < 10; j++) {
                                grid[i][j] = sc.nextInt();
                            }
                        }

                        for (i = 0; i < 10; i++) {
                            k = 0;                    
                            for (j = 0; j < 9; j++) { 
                                linearAnchor[k] = grid[i][j];
                                k++;
                            }
                        }

                        for (i = 0; i < 100; i++) {
                            System.out.print(linearAnchor[i] + " ");
                        }

                        sc.close();
                    }
                }
                `),
      },
      {
        questionId: q2.id,
        language: "Python",
        code: sanitizeCode(`
                # Buggy Energy Signature Analysis

                n = int(input())
                arr = list(map(int, input().split()))

                max1 = max2 = arr[0]   
                min1 = min2 = arr[0]  

                for i in range(1, n):   

                    if arr[i] > max1:
                        max2 = max1
                        max1 = arr[i]
                    elif arr[i] > max2:   
                        max2 = arr[i]

                    if arr[i] < min1:
                        min2 = min1
                        min1 = arr[i]
                    elif arr[i] > min2:   
                        min2 = arr[i]

                print("2nd Max:", max2)
                print("2nd Min:", min2)

              `),
      },
    ],
  });
  await prisma.buggyCode.createMany({
    data: [
      {
        questionId: q3.id,
        language: "C",
        code: sanitizeCode(`
                #include <stdio.h>
                int main() {
                    int energy;
                    int sync;
                    char state[10];

                    scanf("%d", &energy);
                    scanf("%d", &sync);
                    scanf("%s", state);

                    if (energy >= 20000 || sync == 1 || state == "green") {
                        printf("Initiating stabilization sequence...\n");
                        printf("3\n");
                        printf("2\n");
                        printf("1\n");
                        printf("Universe Stabilized!\n");
                    } else {
                        printf("WARNING: System instability detected!\n");
                        printf("Stabilization Failed — Universe Unstable\n");
                    }

                    return 0;
                }
                `),
      },
      {
        questionId: q3.id,
        language: "Cpp",
        code: sanitizeCode(`
                #include <iostream>
                using namespace std;

                int main() {
                    int energyy;
                    int sync;
                    string state;

                    cin >> energy;
                    cin >> sync;
                    cin >> state;

                    for (int i = 0; i < 10; i++){
                        if (energy >= 20000 || sync == 1 || state == "green") {
                            cout << "Initiating stabilization sequence..." << endl;
                            cout << "3" << endl;
                            cout << "2" << endl;
                            cout << "1" << endl;
                            cout << "Universe Stabilized!" << endl;
                        } else {
                            cout << "WARNING: System instability detected!" << endl;
                            cout << "Stabilization Failed — Universe Unstable" << endl;
                        }

                    }
                    return "Done";
                }
                `),
      },
      {
        questionId: q3.id,
        language: "Java",
        code: sanitizeCode(`
              import java.util.Scanner;

              public class Buggy {
                  public static void main(String[] args) {
                      Scanner sc = new Scanner(System.in);

                      int energy = sc.nextInt();
                      int sync = sc.nextInt();
                      String state = sc.next();

                      if (energy >= 20000 || sync == 1 || state == "green") {
                          System.out.println("Initiating stabilization sequence...");
                          System.out.println("3");
                          System.out.println("2");
                          System.out.println("1");
                          System.out.println("Universe Stabilized!");
                      } else {
                          System.out.println("WARNING: System instability detected!");
                          System.out.println("Stabilization Failed — Universe Unstable");
                      }

                      sc.close();
                  }
              }
                `),
      },
      {
        questionId: q3.id,
        language: "Python",
        code: sanitizeCode(`
                energyy = int(input())
                sync = int(input())
                state = input()

                if (energy >= 20000 or sync == 1) or state is "green":
                    print("Initiating stabilization sequence...")
                    print("3")
                    print("2")
                    print("5")
                    print("Universe Stabilized!")
                else:
                    print("WARNING: System instability detected!")
                    print("Stabilization Failed — Universe Unstable")
              `),
      },
    ],
  });

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});

