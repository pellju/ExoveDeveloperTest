# ExoveDeveloperTest
My exercises for the Exove trainee program.

I have done three exercises, which can be found on their folders: 1A, 2B and 3A.

### 1A:
1A is about a simple sorting algorithm, which sorts a given list by the ASCII code of the third letter, following by the second letter and the first letter.
Files included: sorting.js

### 2B:
2B is about an SQL-query showing data in a wanted format (please see [exercise 2B](https://github.com/Exove/developer-test)).
I wrote it for SQLite
Files included: .sql-file containing the query, and a database which contains the given data.

### 3A:
3A is about importing data to a database from a JSON file.
It is written using nodejs and PostgreSQL.
To run the program, a PostgreSQL-database and its information are required.
Database connection information must be edited to .env!
Required libraries have to be installed using `npm i`.

After adding the database infromation and downloading required libraries, the program can be launched using `npm run start`.
Multiple currency- and language-support is possible with a slight modification, but by default, the program uses English and Euro as its default values.