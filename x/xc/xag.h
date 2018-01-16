/**
*  xag.h
*  A file aggregator for the X Library.
*  Copyright 2004-2009 Michael Foster (Cross-Browser.com)
*  Distributed under the terms of the GNU LGPL
*/

// Includes

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <ctype.h>

#ifdef __GNUC__
#include <dirent.h>
#else // WIN32
#include <dir.h>
#endif

//#include <search.h>

// Constants

#define XAG_VER "0.02 beta"
#define XAG_BANNER "xag %s\n"
#define XAG_HELP "usage: xag prj_name[.ext]\nFor more information visit Cross-Browser.com.\n"
#define XAG_MAX_SYMBOLS 300
#define XAG_MAX_APP_FILES XAG_MAX_SYMBOLS
#define XAG_MAX_LINE_LEN 2000
#define XAG_MAX_PATH_LEN 250
#define XAG_MAX_NAME_LEN 100
#define XAG_INVALID 0xFFFF
#define XAG_XML_FILE_MASK "*.xml"
#define XAG_LIB_EXT ".js"
#define XAG_PRJ_EXT ".xag"
#define XAG_XML_ROOT "<x_symbol"
#define XLIB_VER_FILE "xlibrary.js"
#define XLIB_BANNER "/*! Built from X %s by xag %s on %s */\n"

// Types

#ifndef bool
#define bool int
#define true 1
#define false 0
#endif

// Function Prototypes

int main(int argc, char *argv[]);
bool read_project_file(char *name);
bool read_version_file();
bool read_symbol_library();
bool get_symbol_dependents(int sym_idx);
bool get_app_file_symbols(char *fname);
bool create_output_file();
bool append_to_output(FILE *out_fp, char *name, int sym_idx);
int get_symbol_index(char *token, char sym_type);
void set_dependent(int sym_idx, int dep);
void include_symbol(int idx);
void set_symbol_complete(char *s);
int compare_fn(const void *ele1, const void *ele2);
void show_debug_info();

// end xag.h
