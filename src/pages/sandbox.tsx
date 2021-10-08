import React, { useEffect } from "react";

export default () => {

    useEffect(() => {
        runTests()
    }, [])

    const runTests = () => {
        let str = "test this capitalize";
        capitalizeIt(...str);
        oldCapitalize(str);
        arrayTest()

    };

    function arrayTest() {
        let ar = ["123", "adsf", "colors"];
        console.log(Array.isArray(ar));
        //remove last
        ar.pop();
        console.log(ar);
        ar.push("new");
        console.log(ar);
        //remove the firast
        console.log(ar.shift())

        console.log(ar.find(item => {
            return item === "adsf";
        }))

        const array1 = [1, 2, 3, 4];

        // fill with 0 from position 2 until position 4
        console.log(array1.fill(0, 2, 4));
    }
    function oldCapitalize(str) {
        let test = str.split("");
        let res = "";
        let setNext = false;
        for (let i = 0; i < test.length; i++) {
            if (i === 0) {
                res += test[i].toUpperCase();
            } else if (setNext) {
                res += test[i].toUpperCase();
                setNext = false;
            } else {
                res += test[i];
            }

            if (test[i] === " ") {
                setNext = true;
            }

        }
        console.log(res);
    }
    function capitalizeIt(first, ...rest) {
        //to upper
        let test = first.toUpperCase() + rest.join('');
        console.log(test);
        //reverse it
        console.log(test.split('').reverse().join(''));
        //find 'this'
        console.log(test.indexOf('this', 0));
        console.log(test.replace('Test', 'TESTS'));



    }


    return (
        <div>hey! check the console</div>
    )
}