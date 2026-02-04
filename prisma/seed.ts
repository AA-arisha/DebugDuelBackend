import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
      problemStatement: `You are given a 2D array grid[ROWS][COLS] representing the pixelated forest.
                         You must transfer all elements into a 1D array linear_anchor[ROWS * COLS] such that each row follows the previous one in a continuous line.`,
            },
  });
  const q2 = await prisma.question.create({
    data: {
      roundId: round.id,
      title: "Energy Signature Analysis",
      problemStatement: `The Mission: Identify the Anchors The gravity in your home dimension is inverting! 
                        To ground the reality, you must identify the two strongest energy peaks (2nd Max) and the two most stable floor-values (2nd Min). 
                        Because both Kiros are present, their signatures are overlapping.`,
            },
  });
  const q3 = await prisma.question.create({
    data: {
      roundId: round.id,
      title: "Environment Lockdown Sequence",
      problemStatement: `The Paradox-Verse is seconds away from total collapse.
                          As Interstellar Kiro’s corrupted energy surges through the fabric of reality, the environment begins executing its last automated stabilization protocol. This protocol was designed by the Paradox-Verse itself — a failsafe that can temporarily lock reality into a stable state and prevent it from falling into the Glitch Abyss.
                          However, the system is fragile. A single misinterpretation in its logic could cause the universe to fragment permanently.
                          You are tasked with debugging the core stabilization program that determines whether the Paradox-Verse can survive this confrontation.`,
            },
  });

  // 3. Create Test Cases
  await prisma.testCase.createMany({
    data: [
      {
        questionId: q1.id,
        input: `101 102 103
                201 202 203
                301 302 303`,
        expectedOutput: "101 102 103 201 202 203 301 302 303",
        description: "Standard 3x3 flattening",
      },
      
    ],
  });
  await prisma.testCase.createMany({
    data: [
      {
        questionId: q2.id,
        input: `10, 20, 30, 40, 50`,
        expectedOutput: `2nd Max: 40
                         2nd Min: 20`,
        description: "",
      },
      {
        questionId: q2.id,
        input: `89, 45, 89, 12, 67, 12`,
        expectedOutput: `2nd Max: 67
                         2nd Min: 45`,
        description: "",
      },
      
    ],
  });
  await prisma.testCase.createMany({
  data: [
    {
      questionId: q3.id,
      input: `25000
              1
              green`,
      expectedOutput: ` Initiating stabilization sequence...
                        3
                        2
                        1
                        Universe Stabilized!`,
      description: "Successful Stabilization (All Conditions Met)",
    },
    {
      questionId: q3.id,
      input: `15000
              1
              green`,
      expectedOutput: `WARNING: System instability detected!
                       Stabilization Failed — Universe Unstable`,
      description: "Insufficient Energy Core Level",
    },
    {
      questionId: q3.id,
      input: `30000
              0
              green`,
      expectedOutput: `WARNING: System instability detected!
                       Stabilization Failed — Universe Unstable`,
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
        code: `#include <stdio.h>
                int main() {
                    int grid[10][10];
                    int linear_anchor[100];
                    int i, j, k;

                    for (i = 0; i < 10; i++) {
                        for (j = 0; j < 10; j++) {
                            scanf("%d", &grid[i][j]);
                        }
                    }

                    for (i = 0; i < 10; i++) {
                        k = 0;                      
                        for (j = 0; j < 9; j++) {   
                            linear_anchor[k] = grid[i][j];
                            k++;
                        }
                    }

                    for (i = 0; i < 100; i++) {
                        printf("%d ", linear_anchor[i]);
                    }

                    return 0;
                }
                `,
      },
      {
        questionId: q1.id,
        language: "C++",
        code: `#include <iostream>
                using namespace std;

                int main() {
                    int grid[10][10];
                    int linear_anchor[100];
                    int i, j, k;

                    for (i = 0; i < 10; i++) {
                        for (j = 0; j < 10; j++) {
                            cin >> grid[i][j];
                        }
                    }

                    for (i = 0; i < 10; i++) {
                        k = 0;                    
                        for (j = 0; j < 9; j++) { 
                            linear_anchor[k] = grid[i][j];
                            k++;
                        }
                    }

                    for (i = 0; i < 100; i++) {
                        cout << linear_anchor[i] << " ";
                    }

                    return 0;
                }
                `,
      },
      {
        questionId: q1.id,
        language: "Java",
        code: `import java.util.Scanner;
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
                `,
      },
      {
        questionId: q1.id,
        language: "Python",
        code: `grid = [[0 for _ in range(10)] for _ in range(10)]
              linear_anchor = [0 for _ in range(100)]

              for i in range(10):
                  for j in range(10):
                      grid[i][j] = int(input())

              for i in range(10):
                  k = 0                 # LOGICAL ERROR #1
                  for j in range(9):    # LOGICAL ERROR #2
                      linear_anchor[k] = grid[i][j]
                      k += 1

              for x in linear_anchor:
                  print(x, end=" ")
              `,
      },
    ],
  });

  await prisma.buggyCode.createMany({
    data: [
      {
        questionId: q2.id,
        language: "C",
        code: `#include <stdio.h>

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

                `,
      },
      {
        questionId: q2.id,
        language: "C++",
        code: `#include <iostream>
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

                `,
      },
      {
        questionId: q2.id,
        language: "Java",
        code: `import java.util.Scanner;
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
                `,
      },
      {
        questionId: q2.id,
        language: "Python",
        code: `# Buggy Energy Signature Analysis

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

              `,
      },
    ],
  });
  await prisma.buggyCode.createMany({
    data: [
      {
        questionId: q3.id,
        language: "C",
        code: `#include <stdio.h>

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
                `,
      },
      {
        questionId: q3.id,
        language: "C++",
        code: `#include <iostream>
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
                `,
      },
      {
        questionId: q3.id,
        language: "Java",
        code: `import java.util.Scanner;

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
                `,
      },
      {
        questionId: q3.id,
        language: "Python",
        code: ` energyy = int(input())
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
              `,
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
