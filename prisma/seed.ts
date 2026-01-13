import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

<<<<<<< Updated upstream
    // Clear old data
    await prisma.testcase.deleteMany({});
    await prisma.problem.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Array of problems to seed
    const problems = [
      {
        title: "Count Vowels in a String",
        description: `
          You are given a string consisting of lowercase and uppercase letters. 
          Your task is to count the number of vowels in the string and print it. 
          The vowels are a, e, i, o, u (case-insensitive).

          Write a program that takes a string as input and outputs the number of vowels in it.`,
        buggyCodes: {
          cpp: `#include <iostream>
                #include <string>
                using namespace std;

                int main() {
                    string s;
                    cin >> s;
                    int count = 0;

                    for(int i = 0; i <= s.length(); i++) { // Bug 1: should be < s.length()
                        char c = s[i];

                        // Bug 2: only checking lowercase vowels
                        if(c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
                            count = count + 1;
                        }
                    }

                    cout << "Number of vowels: " << count << endl; // Bug 3: extra text
                    return 0;
                }`,

          python: `s = input()
                    count = 0

                    for i in range(len(s)+1):  # Bug 1: should be range(len(s))
                        c = s[i]

                        # Bug 2: only checking lowercase vowels
                        if c in ['a','e','i','o','u']:
                            count += 1

                    print('Number of vowels:', count)  # Bug 3: extra text`,

          javascript: `const readline = require('readline');
                        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

                        rl.question('', (s) => {
                            let count = 0;

                            for(let i = 0; i <= s.length; i++) { // Bug 1: should be < s.length
                                const c = s[i];

                                // Bug 2: only checking lowercase vowels
                                if(['a','e','i','o','u'].includes(c)) {
                                    count++;
                                }
                            }

                            console.log('Number of vowels:', count); // Bug 3: extra text
                            rl.close();
                        });`,

          java: `import java.util.Scanner;

                  public class Main {
                      public static void main(String[] args) {
                          Scanner sc = new Scanner(System.in);
                          String s = sc.next();
                          int count = 0;

                          for(int i = 0; i <= s.length(); i++) { // Bug 1: should be < s.length()
                              char c = s.charAt(i);

                              // Bug 2: only checking lowercase vowels
                              if(c=='a'||c=='e'||c=='i'||c=='o'||c=='u') {
                                  count++;
                              }
                          }

                          System.out.println("Number of vowels: " + count); // Bug 3: extra text
                          sc.close();
                      }
                  }`
        },
        testcases: [
          {
            description: "Simple string with mixed vowels",
            input: "HelloWorld",
            expected: "3",
            isHidden: false,
          },
          {
            description: "String with no vowels",
            input: "rhythm",
            expected: "0",
            isHidden: true,
          },
          {
            description: "All vowels, mixed case",
            input: "AeIoU",
            expected: "5",
            isHidden: true,
          },
          {
            description: "Long string with repeated vowels",
            input: "ProgrammingIsFun",
            expected: "5",
            isHidden: false,
          },
        ],
=======
    await prisma.user.create({
      data:{
        username: 'admin',
        email: 'k240603@nu.edu.pk',
        password: hashedpassword,
        role: 'ADMIN'
>>>>>>> Stashed changes
      },
    ];

    // Loop through each problem and seed
    for (const p of problems) {
      const problem = await prisma.problem.create({
        data: {
          title: p.title,
          description: p.description,
          buggyCodes: JSON.stringify(p.buggyCodes), // Store as JSON string
        },
      });
      console.log(`✅ Created problem: ${problem.title} (ID: ${problem.id})`);

      // Loop through test cases for this problem
      for (const tc of p.testcases) {
        await prisma.testcase.create({
          data: {
            problemId: problem.id,
            description: tc.description,
            input: tc.input,
            expected: tc.expected,
            isHidden: tc.isHidden,
          },
        });
      }

      console.log(`✅ Added ${p.testcases.length} test cases for problem: ${problem.title}`);
    }

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
