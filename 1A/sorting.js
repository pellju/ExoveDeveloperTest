listOfWords = ['BOAT', 'Locomotive', 'Poet', 'Accelerate', 'GOLF', 'ACCIDENTAL', 'Submarine', 'AAA', 'ÄAA', 'AAA']; //List given and added some examples.
//The idea of this sorting algorithm:
//Sorting the given array of words.
//The first sorting is done using the third letter.
//Then the seconds sorting is done using the second letter.
//Then the third (and the last) sorting is done using the first letter.

function sorting(x,y,position) { //DRY (don't repeat yourself) method for the sorting, x and y are the words compared, and position is the index of the wanted character.
    if (x.charCodeAt(position) > y.charCodeAt(position)) {
        return 1;
    } else if (x.charCodeAt(position) < y.charCodeAt(position)) {
        return -1;
    } else { //If the characters still equal...
        if (position == 0) { //... if the index is 0, return that "all the first three characters equal".
            return 0;
        } else {
            return sorting(x,y,position-1); //if the index is not 0, sort again, this time reduce the index by one.
        }
    }
}

listOfWords.sort(function(x,y) { //The sorting the list, starting at checking the third character.
    if (x.charCodeAt(2) > y.charCodeAt(2)) { //Comparing characters in ASCII.
        return 1;
    } else if (x.charCodeAt(2) < y.charCodeAt(2)) {
        return -1;
    } else {
        return sorting(x,y,1); //If the characters are the same, checking the second letter.
    }
});

console.log(listOfWords);

//Output:
/*[ 'AAA',
*  'AAA',
*  'ÄAA',
*  'BOAT',
*  'ACCIDENTAL',
*  'GOLF',
*  'Submarine',
*  'Accelerate',
*  'Locomotive',
*  'Poet' ]
*/