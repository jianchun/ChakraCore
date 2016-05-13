#!/usr/bin/env python
#-------------------------------------------------------------------------------------------------------
# Copyright (C) Microsoft. All rights reserved.
# Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
#-------------------------------------------------------------------------------------------------------

import sys
import os
import subprocess as SP
import argparse, textwrap
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(
    description='ChakraCore *nix Test Script',
    formatter_class=argparse.RawDescriptionHelpFormatter,
    epilog=textwrap.dedent('''\
        Samples:

        test all folders:
            {0}

        test only Array:
            {0} Array

        test a single file:
            {0} Basics/hello.js
    '''.format(sys.argv[0]))
    )
parser.add_argument('folders', metavar='folder', nargs='*')
args = parser.parse_args()

test_root = os.path.dirname(os.path.realpath(__file__))

# ugly trick
ch_path = os.path.join(os.path.dirname(test_root), "BuildLinux/ch")

if not os.path.isfile(ch_path):
    print "BuildLinux/ch not found. Did you run ./build.sh already?"
    sys.exit(1)


def show_failed(filename, output, exit_code, expected_output):
    print "\nFailed ->", filename
    if expected_output == None:
        print "\nOutput:"
        print "----------------------------"
        print output
        print "----------------------------"
    else:
        lst_output = output.split('\n')
        lst_expected = expected_output.split('\n')
        ln = min(len(lst_output), len(lst_expected))
        for i in range(0, ln):
            if lst_output[i] != lst_expected[i]:
                print "Output: (at line " + str(i) + ")"
                print "----------------------------"
                print lst_output[i]
                print "----------------------------"
                print "Expected Output:"
                print "----------------------------"
                print lst_expected[i]
                print "----------------------------"
                break

    print "exit code:", exit_code
    print "\nFailed!"
    sys.exit(exit_code)

def test_path(path):
    if os.path.isfile(path):
        folder, file = os.path.dirname(path), os.path.basename(path)
    else:
        folder, file = path, None

    tests = load_tests(folder, file)
    if len(tests) == 0:
        return

    print "Testing ->", os.path.basename(folder)
    return

    for js_file in files:
        if is_file or os.path.splitext(js_file)[1] == '.js':
            js_file = os.path.join(folder, js_file)
            js_output = ""

            if not os.path.isfile(js_file):
                print "Javascript file doesn't exist (" + js_file + ")"
                sys.exit(1)

            p = SP.Popen([ch_path, js_file], stdout=SP.PIPE, stderr=SP.STDOUT, close_fds=True)
            js_output = p.communicate()[0].replace('\r','')
            exit_code = p.wait()

            if exit_code != 0:
                show_failed(js_file, js_output, exit_code, None)
            else: #compare outputs
                baseline = os.path.splitext(js_file)[0] + '.baseline'
                baseline = os.path.join(folder, baseline)
                if os.path.isfile(baseline):
                    expected_output = None
                    with open(baseline, 'r') as bs_file:
                        expected_output = bs_file.read().replace('\r', '')
                    # todo: compare line by line and use/implement wild cards support
                    # todo: by default we discard line endings (xplat), make this optional
                    if expected_output.replace('\n', '') != js_output.replace('\n', ''):
                        show_failed(js_file, js_output, exit_code, expected_output)

            if not is_file:
                print "\tPassed ->", os.path.basename(js_file)

def load_tests(folder, file):
    try:
        xmlpath = os.path.join(folder, 'rlexe.xml')
        xml = ET.parse(xmlpath).getroot()
    except IOError:
        return []

    tests = [load_test(x) for x in xml]
    if file != None:
        tests = [x for x in tests if x['files'] == file]
    return tests

def load_test(test):
    pass

def is_jsfile(path):
    return os.path.splitext(path)[1] == '.js'

def main():
    # By default run all tests
    if len(args.folders) == 0:
        args.folders = [os.path.join(test_root, x)
                        for x in sorted(os.listdir(test_root))]

    for folder in args.folders:
        test_path(folder)

    print 'Success!'
    return 0

if __name__ == '__main__':
    sys.exit(main())
