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
  // const q1 = await prisma.question.create({
  //   data: {
  //     roundId: round.id,
  //     title: "The Flattening Logic",
  //     problemStatement: sanitizeCode(`
  //                        You are given a 2D array grid[ROWS][COLS] representing the pixelated forest.
  //                        You must transfer all elements into a 1D array linear_anchor[ROWS * COLS] such that each row follows the previous one in a continuous line.`),
  //           },
  // });
  // const q2 = await prisma.question.create({
  //   data: {
  //     roundId: round.id,
  //     title: "Energy Signature Analysis",
  //     problemStatement: sanitizeCode(`
  //                       The Mission: Identify the Anchors The gravity in your home dimension is inverting! 
  //                       To ground the reality, you must identify the two strongest energy peaks (2nd Max) and the two most stable floor-values (2nd Min). 
  //                       Because both Kiros are present, their signatures are overlapping.`),
  //           },
  // });
  // const q3 = await prisma.question.create({
  //   data: {
  //     roundId: round.id,
  //     title: "Environment Lockdown Sequence",
  //     problemStatement: sanitizeCode(`
  //                         The Paradox-Verse is seconds away from total collapse.
  //                         As Interstellar Kiro's corrupted energy surges through the fabric of reality, the environment begins executing its last automated stabilization protocol. This protocol was designed by the Paradox-Verse itself — a failsafe that can temporarily lock reality into a stable state and prevent it from falling into the Glitch Abyss.
  //                         However, the system is fragile. A single misinterpretation in its logic could cause the universe to fragment permanently.
  //                         You are tasked with debugging the core stabilization program that determines whether the Paradox-Verse can survive this confrontation.`),
  //           },
  // });

  const q1 = await prisma.question.create({
  data: {
    roundId: round.id,
    title: "Temporal Stability Analyzer",
    problemStatement: sanitizeCode(`
Paradox-Verse has detected a minor temporal disturbance — not a full collapse, but enough to trigger the Incognito Board’s alert system. 
Paradox-Verse Kiro is tasked with running a basic diagnostic to count stable timelines before the Glitch grows stronger.

Each timeline reports a stability value. A timeline is considered safe if its stability value is greater than or equal to a given limit K. 
The stabilization system should count how many such timelines exist.

However, AntiVerse Kiro has interfered with the diagnostic program. Because of this interference, the system is producing incorrect results even for simple inputs. 
The error is not complex, but it prevents the system from functioning correctly.

You are given the current implementation of the diagnostic code.
    `),
  },
});

await prisma.buggyCode.createMany({
  data: [
    {
      questionId: q1.id,
      language: "C",
      code: sanitizeCode(`
#include <stdio.h>
#include <stdlib.h>

struct TemporalStabilityAnalyzer {
    int n, k;
    int *a;
};

void readInput(struct TemporalStabilityAnalyzer *t) {
    scanf("%d %d", &t->n, &t->k);
    t->a = (int *)malloc(t->n * sizeof(int));
    for (int i = 0; i < t->n; i++) {
        scanf("%d", &t->a[i]);
    }
}

int countStableTimelines(struct TemporalStabilityAnalyzer *t) {
    int cnt = 0;
    for (int i = 0; i < t->n; i++) {
        if (t->a[i] >= t->k) {
            cnt++;
        }
    }
    return cnt;
}

int main() {
    struct TemporalStabilityAnalyzer t;
    readInput(&t);
    printf("%d\\n", countStableTimelines(&t));
    return 0;
}
      `),
    },
    {
      questionId: q1.id,
      language: "Cpp",
      code: sanitizeCode(`
#include <bits/stdc++.h>
using namespace std;

class TemporalStabilityAnalyzer {
private:
    int n, k;
    int *a;
public:
    TemporalStabilityAnalyzer() { a = nullptr; }

    void readInput() {
        cin >> n >> k;
        a = new int[n];
        for (int i = 0; i < n; i++) {
            cin >> a[i];
        }
    }

    int countStableTimelines() {
        int cnt = 0;
        for (int i = 0; i < n; i++) {
            if (a[i] >= k) {
                cnt++;
            }
        }
        return cnt;
    }

    void process() {
        cout << countStableTimelines() << endl;
    }
};

int main() {
    TemporalStabilityAnalyzer analyzer;
    analyzer.readInput();
    analyzer.process();
    return 0;
}
      `),
    },
    {
      questionId: q1.id,
      language: "Java",
      code: sanitizeCode(`
import java.util.*;

class TemporalStabilityAnalyzer {
    private int n, k;
    private int[] a;

    public void readInput(Scanner sc) {
        n = sc.nextInt();
        k = sc.nextInt();
        a = new int[n];
        for (int i = 0; i < n; i++) {
            a[i] = sc.nextInt();
        }
    }

    public int countStableTimelines() {
        int cnt = 0;
        for (int i = 0; i < n; i++) {
            if (a[i] >= k) {
                cnt++;
            }
        }
        return cnt;
    }

    public void process() {
        System.out.println(countStableTimelines());
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        TemporalStabilityAnalyzer analyzer = new TemporalStabilityAnalyzer();
        analyzer.readInput(sc);
        analyzer.process();
    }
}
      `),
    },
    {
      questionId: q1.id,
      language: "Python",
      code: sanitizeCode(`
class TemporalStabilityAnalyzer:
    def __init__(self):
        self.n = 0
        self.k = 0
        self.a = []

    def read_input(self):
        self.n, self.k = map(int, input().split())
        self.a = list(map(int, input().split()))

    def count_stable_timelines(self):
        cnt = 0
        for x in self.a:
            if x >= self.k:
                cnt += 1
        return cnt

    def process(self):
        print(self.count_stable_timelines())

analyzer = TemporalStabilityAnalyzer()
analyzer.read_input()
analyzer.process()
      `),
    },
  ],
});

await prisma.testCase.createMany({
  data: [
    {
      questionId: q1.id,
      input: sanitizeCode(`3 41
2 3 42`),
      expectedOutput: "3",
      description: "Small input with 3 timelines, threshold 41",
     
    },
    {
      questionId: q1.id,
      input: sanitizeCode(`3 11
2 3 12`),
      expectedOutput: "1",
      description: "Small input with 3 timelines, threshold 11",

    },
    {
      questionId: q1.id,
      input: sanitizeCode(`1000 500
15542 468 335 501 170 725 479 359 963 465 706 146 282 828 962 492 996 943 828 437 392 605 903 154 293 383 422 717 719 896 448 727 772 539 870 913 668 300 36 895 704 812 323 334 674 665 142 712 254 869 548 645 663 758 38 860 724 742 530 779 317 36 191 843 289 107 41 943 265 649 447 806 891 730 371 351 7 102 394 549 630 624 85 955 757 841 967 377 932 309 945 440 627 324 538 539 119 83 930 542 834 116 640 659 705 931 978 307 674 387 22 746 925 73 271 830 778 574 98 513 987 291 162 637 356 768 656 575 32 53 351 151 942 725 967 431 108 192 8 338 458 288 754 384 946 910 210 759 222 589 423 947 507 31 414 169 901 592 763 656 411 360 625 538 549 484 596 42 603 351 292 837 375 21 597 22 349 200 669 485 282 735 54 1000 419 939 901 789 128 468 729 894 649 484 808 422 311 618 814 515 310 617 936 452 601 250 520 557 799 304 225 9 845 610 990 703 196 486 94 344 524 588 315 504 449 201 459 619 581 797 799 282 590 799 10 158 473 623 539 293 39 180 191 658 959 192 816 889 157 512 203 635 273 56 329 647 363 887 876 434 870 143 845 417 882 999 323 652 22 700 558 477 893 390 76 713 601 511 4 870 862 689 402 790 256 424 3 586 183 286 89 427 618 758 833 933 170 155 722 190 977 330 369 693 426 556 435 550 442 513 146 61 719 754 140 424 280 997 688 530 550 438 867 950 194 196 298 417 287 106 489 283 456 735 115 702 317 672 787 264 314 356 186 54 913 809 833 946 314 757 322 559 647 983 482 145 197 223 130 162 536 451 174 467 45 660 293 440 254 25 155 511 746 650 187 314 475 23 169 19 788 906 959 392 203 626 478 415 315 825 335 875 373 160 834 71 488 298 519 178 774 271 764 669 193 986 103 481 214 628 803 100 528 626 544 925 24 973 62 182 4 433 506 594 726 32 493 143 223 287 65 901 188 361 414 975 271 171 236 834 712 761 897 668 286 551 141 695 696 625 20 126 577 695 659 303 372 467 679 594 852 485 19 465 120 153 801 88 61 927 11 758 171 316 577 228 44 759 165 110 883 87 566 488 578 475 626 628 630 929 424 521 903 963 124 597 738 262 196 526 265 261 203 117 31 327 12 772 412 548 154 521 791 925 189 764 941 852 663 830 901 714 959 579 366 8 478 201 59 440 304 761 358 325 478 109 114 888 802 851 461 429 994 385 406 541 112 705 836 357 73 351 824 486 557 217 627 358 527 358 338 272 870 362 897 23 618 113 718 697 586 42 424 130 230 566 560 933 297 856 54 963 585 735 655 973 458 370 533 964 608 484 912 636 68 849 676 939 224 143 755 512 742 176 460 826 222 871 627 935 206 784 851 399 280 702 194 735 638 535 557 994 177 706 963 549 882 301 414 642 856 856 143 463 612 878 425 679 753 444 297 674 41 314 876 73 819 611 18 933 113 696 170 832 41 489 686 91 498 590 991 146 354 315 652 741 45 259 336 760 193 606 265 182 504 830 776 609 293 998 550 557 562 628 468 542 130 241 814 175 602 78 216 684 214 993 825 602 393 760 671 429 28 85 76 787 499 971 288 848 605 504 222 664 707 364 11 172 490 241 165 543 620 914 592 705 819 233 751 206 976 540 304 423 99 248 585 649 972 865 914 76 546 713 547 679 770 263 520 986 290 945 866 541 246 509 319 871 602 324 133 473 153 88 571 764 902 104 424 528 601 970 16 566 29 544 348 89 944 638 410 464 50 682 589 343 609 61 222 759 955 889 147 691 950 844 431 621 749 68 537 784 36 227 186 39 854 630 225 749 924 360 258 767 945 956 319 727 412 26 356 2 550 497 585 516 965 343 76 914 143 197 949 73 427 607 174 430 405 706 627 813 376 94 566 37 737 142 815 995 257 653 937 839 483 356 16 132 231 842 626 12 638 187 691 651 663 635 894 354 417 453 9 263 234 455 304 635 304 257 149 125 318 214 110 29 201 81 319 859 51 156 362 265 904 677 644 910 903 562 490 949 283 654 675 221 403 924 832 370 879 260 9 620 972 4 946 782 505 393 686 314 699 590 723 939 38 411 462 235 509 962 960 494 516 270 938 870 59 701 972 265 118 216 556 816 331 40 213 289 83 955 86 711 485 775 381 816 952 542 116 680 111 899 74 789 978 133 957 690 114 9 942 791 724 364 29 185 779 201 72 886 975 72 334 868 154 296 169 826 677 630 651 599 310 694 687 81 117 250`),
      expectedOutput: "161",
      description: "Large input test case with 1000 timelines",
      isVisible: false,
    },
  ],
});


//   // 3. Create Test Cases
//   await prisma.testCase.createMany({
//     data: [
//       {
//         questionId: q1.id,
//         input: sanitizeCode(`101 102 103
// 201 202 203
// 301 302 303`),
//         expectedOutput: "101 102 103 201 202 203 301 302 303",
//         description: "Standard 3x3 flattening",
//       },
      
//     ],
//   });
// await prisma.testCase.createMany({
//   data: [
//     {
//       questionId: q2.id,
//       input: sanitizeCode(`5
// 10 20 30 40 50`),
//       expectedOutput: sanitizeCode(`
// 2nd Max: 40
// 2nd Min: 20
//       `),
//       description: "Simple increasing sequence",
//     },
//     {
//       questionId: q2.id,
//       input: sanitizeCode(`6
// 89 45 89 12 67 12`),
//       expectedOutput: sanitizeCode(`
// 2nd Max: 67
// 2nd Min: 45
//       `),
//       description: "Contains duplicates",
//     },
//     {
//       questionId: q2.id,
//       input: sanitizeCode(`5
// -1 -5 -3 -10 -7`),
//       expectedOutput: sanitizeCode(`
// 2nd Max: -3
// 2nd Min: -7
//       `),
//       description: "Negative numbers",
//     },
//     {
//       questionId: q2.id,
//       input: sanitizeCode(`6
// 1 2 3 4 5 6`),
//       expectedOutput: sanitizeCode(`
// 2nd Max: 5
// 2nd Min: 2
//       `),
//       description: "Sequential numbers",
//       isVisible: false,
//     },
//   ],
// });

//   await prisma.testCase.createMany({
//   data: [
//     {
//       questionId: q3.id,
//       input: sanitizeCode(`
//                 25000
//                 1
//                 green`),
//       expectedOutput: sanitizeCode(` 
//                         Initiating stabilization sequence...
//                         3
//                         2
//                         1
//                         Universe Stabilized!`),
//       description: "Successful Stabilization (All Conditions Met)",
//     },
//     {
//       questionId: q3.id,
//       input: sanitizeCode(`
//               15000
//               1
//               green`),
//       expectedOutput: sanitizeCode(`
//                        WARNING: System instability detected!
//                        Stabilization Failed — Universe Unstable`),
//       description: "Insufficient Energy Core Level",
//     },
//     {
//       questionId: q3.id,
//       input: sanitizeCode(`
//               30000
//               0
//               green`),
//       expectedOutput: sanitizeCode(`
//                        WARNING: System instability detected!
//                        Stabilization Failed — Universe Unstable`),
//       description: "Guardian Sync Failure",
//       isVisible: false
//     },
//   ],
// });


//   // 4. Create Buggy Code Snippets
//   await prisma.buggyCode.createMany({
//   data: [
//     {
//       questionId: q1.id,
//       language: "C",
//       code: sanitizeCode(`
//         #include <stdio.h>
//         int main() {
//             int grid[3][3];
//             int linear_anchor[9];
//             int i, j, k;
//             for (i = 0; i < 3; i++) {
//                 for (j = 0; j < 3; j++) {
//                     scanf("%d", &grid[i][j]);
//                 }
//             }
//             for (i = 0; i < 3; i++) {
//                 k = 0;                      
//                 for (j = 0; j < 2; j++) {   // still buggy
//                     linear_anchor[k] = grid[i][j];
//                     k++;
//                 }
//             }
//             for (i = 0; i < 9; i++) {
//                 printf("%d ", linear_anchor[i]);
//             }
//             return 0;
//         }
//       `),
//     },
//     {
//       questionId: q1.id,
//       language: "Cpp",
//       code: sanitizeCode(`
//         #include <iostream>
//         using namespace std;

//         int main() {
//             int grid[3][3];
//             int linear_anchor[9];
//             int i, j, k;

//             for (i = 0; i < 3; i++) {
//                 for (j = 0; j < 3; j++) {
//                     cin >> grid[i][j];
//                 }
//             }

//             for (i = 0; i < 3; i++) {
//                 k = 0;                    
//                 for (j = 0; j < 2; j++) { // still buggy
//                     linear_anchor[k] = grid[i][j];
//                     k++;
//                 }
//             }

//             for (i = 0; i < 9; i++) {
//                 cout << linear_anchor[i] << " ";
//             }

//             return 0;
//         }
//       `),
//     },
//     {
//       questionId: q1.id,
//       language: "Java",
//       code: sanitizeCode(`
//         import java.util.Scanner;
//         public class BuggyFlatten {
//             public static void main(String[] args) {
//                 Scanner sc = new Scanner(System.in);

//                 int[][] grid = new int[3][3];
//                 int[] linearAnchor = new int[9];
//                 int i, j, k;

//                 for (i = 0; i < 3; i++) {
//                     for (j = 0; j < 3; j++) {
//                         grid[i][j] = sc.nextInt();
//                     }
//                 }

//                 for (i = 0; i < 3; i++) {
//                     k = 0;                    
//                     for (j = 0; j < 2; j++) { // still buggy
//                         linearAnchor[k] = grid[i][j];
//                         k++;
//                     }
//                 }

//                 for (i = 0; i < 9; i++) {
//                     System.out.print(linearAnchor[i] + " ");
//                 }

//                 sc.close();
//             }
//         }
//       `),
//     },
//     {
//       questionId: q1.id,
//       language: "Python",
//       code: sanitizeCode(`
//         grid = [[0 for _ in range(3)] for _ in range(3)]
//         linear_anchor = [0 for _ in range(9)]

//         for i in range(3):
//             for j in range(3):
//                 grid[i][j] = int(input())

//         for i in range(3):
//             k = 0                 # LOGICAL ERROR #1
//             for j in range(2):    # LOGICAL ERROR #2
//                 linear_anchor[k] = grid[i][j]
//                 k += 1

//         for x in linear_anchor:
//             print(x, end=" ")
//       `),
//     },
//   ],
// });


//   await prisma.buggyCode.createMany({
//     data: [
//       {
//         questionId: q2.id,
//         language: "C",
//         code: sanitizeCode(`
//                 #include <stdio.h>
//                 int main() {
//                     int n, i;
//                     int arr[100];
//                     int max1, max2;
//                     int min1, min2;
//                     scanf("%d", &n);
//                     for (i = 0; i < n; i++) {
//                         scanf("%d", &arr[i]);
//                     }
//                     max1 = max2 = arr[0];   
//                     min1 = min2 = arr[0];   

//                     for (i = 1; i < n; i++) {   

//                         if (arr[i] > max1) {
//                             max2 = max1;
//                             max1 = arr[i];
//                         } else if (arr[i] > max2) {   
//                             max2 = arr[i];
//                         }

//                         if (arr[i] < min1) {
//                             min2 = min1;
//                             min1 = arr[i];
//                         } else if (arr[i] > min2) {   
//                             min2 = arr[i];
//                         }
//                     }

//                     printf("2nd Max: %d\n", max2);
//                     printf("2nd Min: %d\n", min2);

//                     return 0;
//                 }

//                 `),
//       },
//       {
//         questionId: q2.id,
//         language: "Cpp",
//         code: sanitizeCode(`
//                 #include <iostream>
//                 using namespace std;

//                 int main() {
//                     int n;
//                     int arr[100];
//                     int max1, max2;
//                     int min1, min2;

//                     cin >> n;

//                     for (int i = 0; i < n; i++) {
//                         cin >> arr[i];
//                     }

//                     max1 = max2 = arr[0];   
//                     min1 = min2 = arr[0];   

//                     for (int i = 1; i < n; i++) {   

//                         if (arr[i] > max1) {
//                             max2 = max1;
//                             max1 = arr[i];
//                         } 
//                         else if (arr[i] > max2) {   
//                             max2 = arr[i];
//                         }

//                         if (arr[i] < min1) {
//                             min2 = min1;
//                             min1 = arr[i];
//                         } 
//                         else if (arr[i] > min2) {   
//                             min2 = arr[i];
//                         }
//                     }

//                     cout << "2nd Max: " << max2 << endl;
//                     cout << "2nd Min: " << min2 << endl;

//                     return 0;
//                 }

//                 `),
//       },
//       {
//         questionId: q2.id,
//         language: "Java",
//         code: sanitizeCode(`
//                 import java.util.Scanner;
//                 public class BuggyFlatten {
//                     public static void main(String[] args) {
//                         Scanner sc = new Scanner(System.in);

//                         int[][] grid = new int[10][10];
//                         int[] linearAnchor = new int[100];
//                         int i, j, k;

//                         for (i = 0; i < 10; i++) {
//                             for (j = 0; j < 10; j++) {
//                                 grid[i][j] = sc.nextInt();
//                             }
//                         }

//                         for (i = 0; i < 10; i++) {
//                             k = 0;                    
//                             for (j = 0; j < 9; j++) { 
//                                 linearAnchor[k] = grid[i][j];
//                                 k++;
//                             }
//                         }

//                         for (i = 0; i < 100; i++) {
//                             System.out.print(linearAnchor[i] + " ");
//                         }

//                         sc.close();
//                     }
//                 }
//                 `),
//       },
//       {
//         questionId: q2.id,
//         language: "Python",
//         code: sanitizeCode(`
//                 # Buggy Energy Signature Analysis

//                 n = int(input())
//                 arr = list(map(int, input().split()))

//                 max1 = max2 = arr[0]   
//                 min1 = min2 = arr[0]  

//                 for i in range(1, n):   

//                     if arr[i] > max1:
//                         max2 = max1
//                         max1 = arr[i]
//                     elif arr[i] > max2:   
//                         max2 = arr[i]

//                     if arr[i] < min1:
//                         min2 = min1
//                         min1 = arr[i]
//                     elif arr[i] > min2:   
//                         min2 = arr[i]

//                 print("2nd Max:", max2)
//                 print("2nd Min:", min2)

//               `),
//       },
//     ],
//   });
//   await prisma.buggyCode.createMany({
//     data: [
//       {
//         questionId: q3.id,
//         language: "C",
//         code: sanitizeCode(`
//                 #include <stdio.h>
//                 int main() {
//                     int energy;
//                     int sync;
//                     char state[10];

//                     scanf("%d", &energy);
//                     scanf("%d", &sync);
//                     scanf("%s", state);

//                     if (energy >= 20000 || sync == 1 || state == "green") {
//                         printf("Initiating stabilization sequence...\n");
//                         printf("3\n");
//                         printf("2\n");
//                         printf("1\n");
//                         printf("Universe Stabilized!\n");
//                     } else {
//                         printf("WARNING: System instability detected!\n");
//                         printf("Stabilization Failed — Universe Unstable\n");
//                     }

//                     return 0;
//                 }
//                 `),
//       },
//       {
//         questionId: q3.id,
//         language: "Cpp",
//         code: sanitizeCode(`
//                 #include <iostream>
//                 using namespace std;

//                 int main() {
//                     int energyy;
//                     int sync;
//                     string state;

//                     cin >> energy;
//                     cin >> sync;
//                     cin >> state;

//                     for (int i = 0; i < 10; i++){
//                         if (energy >= 20000 || sync == 1 || state == "green") {
//                             cout << "Initiating stabilization sequence..." << endl;
//                             cout << "3" << endl;
//                             cout << "2" << endl;
//                             cout << "1" << endl;
//                             cout << "Universe Stabilized!" << endl;
//                         } else {
//                             cout << "WARNING: System instability detected!" << endl;
//                             cout << "Stabilization Failed — Universe Unstable" << endl;
//                         }

//                     }
//                     return "Done";
//                 }
//                 `),
//       },
//       {
//         questionId: q3.id,
//         language: "Java",
//         code: sanitizeCode(`
//               import java.util.Scanner;

//               public class Buggy {
//                   public static void main(String[] args) {
//                       Scanner sc = new Scanner(System.in);

//                       int energy = sc.nextInt();
//                       int sync = sc.nextInt();
//                       String state = sc.next();

//                       if (energy >= 20000 || sync == 1 || state == "green") {
//                           System.out.println("Initiating stabilization sequence...");
//                           System.out.println("3");
//                           System.out.println("2");
//                           System.out.println("1");
//                           System.out.println("Universe Stabilized!");
//                       } else {
//                           System.out.println("WARNING: System instability detected!");
//                           System.out.println("Stabilization Failed — Universe Unstable");
//                       }

//                       sc.close();
//                   }
//               }
//                 `),
//       },
//       {
//         questionId: q3.id,
//         language: "Python",
//         code: sanitizeCode(`
//                 energyy = int(input())
//                 sync = int(input())
//                 state = input()

//                 if (energy >= 20000 or sync == 1) or state is "green":
//                     print("Initiating stabilization sequence...")
//                     print("3")
//                     print("2")
//                     print("5")
//                     print("Universe Stabilized!")
//                 else:
//                     print("WARNING: System instability detected!")
//                     print("Stabilization Failed — Universe Unstable")
//               `),
//       },
//     ],
//   });

  


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

