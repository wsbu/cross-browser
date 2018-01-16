/**
*  xag.c
*  A file aggregator for the X Library.
*  Copyright 2004-2009 Michael Foster (Cross-Browser.com)
*  Distributed under the terms of the GNU LGPL
*
*  v0.02 beta, 27Nov09
*  Added the "output" option.
*  v0.01 beta, 9Mar09
*  Split XC into two projects: XAG and XPP. Removed the compression, obfuscation,
*  and objectification features so this is now just an aggregator. Now compiling
*  with MinGW. For complete revision history see 'xc_reference.php'.
*/

// Includes -------------------------------------------------------------------

#include "xag.h"
#include "util.h"

// Module Variables -----------------------------------------------------------

typedef struct tag_symbol
{
  char id[XAG_MAX_NAME_LEN];    // Symbol identifier.
  char src[XAG_MAX_NAME_LEN];   // Source file name.
  int dep[XAG_MAX_SYMBOLS];     /* An array of dependencies for this symbol,
                               each array element is an index into the symbols array. */
  int dep_len;              // Length of the dep array.
  int inc;                  // Number of times this symbol was found in the app files.
  bool out;                 // Indicates this src file has been written to the output file.
  char type;                // Symbol type, 'V', 'O', 'P', 'M' or 'F'.
} t_symbol;
static t_symbol m_symbol[XAG_MAX_SYMBOLS];
static int m_symbol_len = 0;

struct
{
  bool lib;  // true = Generate output file. Default = true.
  bool app;  // true = Includes application js files into output file. Default = false.
  bool dep;  /* true = Symbol dependents included in output. Default = true.
                When false it is useful for creating a lib file from a list of X symbols.
                I use -dep to create x_core.js, x_event.js, etc. */
  bool dbg;  // true = Debug info in log file. Default = false.
} m_option;

static char x_ver[XAG_MAX_NAME_LEN]; // current X version string read from XLIB_VER_FILE
static char prj_name[XAG_MAX_PATH_LEN]; // The project name (filename without extension).
static char prj_ext[XAG_MAX_NAME_LEN]; // The project file extension.
static char lib_path[XAG_MAX_PATH_LEN]; // Path to the X lib files.
static char m_app_file[XAG_MAX_APP_FILES][XAG_MAX_PATH_LEN]; // Array of app file pathnames.
static int m_app_file_len = 0; // Length of the m_app_file array.
static char prev_token[XAG_MAX_NAME_LEN]; // the previous token
static char out_file[XAG_MAX_PATH_LEN]; // output filename

// Function Definitions -------------------------------------------------------

int main(int argc, char *argv[])
{
  int i;

  printf(XAG_BANNER, XAG_VER);

  // Expects argv[1] to be project name with optional extension,
  // and expects it in the current directory.
  if (argc <= 1) {
    printf(XAG_HELP);
    return 1;
  }

  // Read project file.
  out_file[0] = 0;
  if (!read_project_file(argv[1])) {
    printf(XAG_HELP);
    return 2;
  }

  // Parse X Library version string.
  if (!read_version_file()) {
    return 3;
  }

  // Create symbol table and sort it.
  if (!read_symbol_library()) {
    return 4;
  }
  qsort(m_symbol, m_symbol_len, sizeof(t_symbol), compare_fn);

  // Get symbols used in library files.
  if (m_option.dbg) {
    printf("Lib File Dependencies\n");
  }
  for (i = 0; i < m_symbol_len; ++i) {
    prev_token[0] = 0;
    if (!get_symbol_dependents(i)) {
      return 5;
    }
  }

  // Get symbols used in application files.
  if (m_option.dbg) {
    printf("App File Dependencies\n");
  }
  for (i = 0; i < m_app_file_len; ++i) {
    prev_token[0] = 0;
    if (!get_app_file_symbols(m_app_file[i])) {
      return 6;
    }
  }

  // Force the inclusion of the 'xLibrary' object.
  include_symbol(get_symbol_index("xLibrary", 'O'));

  // Create output library file.
  if (m_option.lib) {
    if (!create_output_file()) {
      return 7;
    }
  }

  // Report results.
  if (m_option.lib) {
    printf("created %s\n", out_file);
  }

  if (m_option.dbg) {
    show_debug_info();
  }

  return 0; // success
}

/*
  Reads options, libpath and appfiles from project file.
  See the xc_reference for project file details.
*/
bool read_project_file(char *name)
{
  FILE *fp;
  bool opt;
  char *p, line[XAG_MAX_LINE_LEN], *t, token[XAG_MAX_PATH_LEN];

  // XC does not require a specific extension for the project file,
  // but supplies XAG_PRJ_EXT if an ext is not found.
  // Thanks to gagenellina for this idea.
  strcpy(prj_name, name);
  p = strchr(prj_name, '.');
  if (p)
  {
    strcpy(prj_ext, p);
    *p = 0;
  }
  else strcpy(prj_ext, XAG_PRJ_EXT);

  // Open the project file.
  strcpy(line, prj_name); // use 'line' temporarily
  strcat(line, prj_ext);
  if ((fp = fopen(line, "r")) == NULL)
  {
    printf("Error: Could not open project file: %s%s\n", prj_name, prj_ext);
    return false;
  }

  // option defaults
  m_option.lib = true;
  m_option.app = false;
  m_option.dep = true;
  m_option.dbg = false;

  while (fgets(line, XAG_MAX_LINE_LEN, fp) != NULL )
  {
    p = line;
    skip_white_space(&p);
    // skip newlines and comment lines
    if (*p == ';' || *p == '\n')
    {
      continue;
    }
    // expect directive as first token on line
    t = token;
    while (*p && *p != ' ' && *p != '\t' && *p != '\n' && *p != ';')
    {
      *t++ = *p++;
    }
    *t = 0;
    skip_white_space(&p);
    // process directives
    if (!stricmp(token, "output"))
    {
      t = token;
      while (*p && *p != '\n' && *p != ';')
      {
        *t++ = *p++;
      }
      *t = 0;
      rtrim(token);
      strcpy(out_file, token);
    }
    else if (!stricmp(token, "libpath"))
    {
      t = token;
      while (*p && *p != '\n' && *p != ';')
      {
        *t++ = *p++;
      }
      *t = 0;
      rtrim(token);
      strcpy(lib_path, token);
    }
    else if (!stricmp(token, "appfiles"))
    {
      // get app file pathnames (expects one per line)
      m_app_file_len = 0;
      while (fgets(line, XAG_MAX_LINE_LEN, fp) != NULL )
      {
        p = line;
        skip_white_space(&p);
        if (*p != ';' && *p != '\n')
        {
          rtrim(p);
          strcpy(m_app_file[m_app_file_len++], p);
        }
      }
    }
    else if (!stricmp(token, "options"))
    {
      // parse space-separated options on this line
      while (*p && *p != '\n' && *p != ';')
      {
        t = token;
        while (*p && *p != ' ' && *p != '\t' && *p != '\n' && *p != ';')
        {
          *t++ = tolower(*p++);
        }
        *t = 0;
        skip_white_space(&p);
        opt = *token == '-' ? false : true;
        if (strstr(token, "lib")) { m_option.lib = opt; }
        else if (strstr(token, "app")) { m_option.app = opt; }
        else if (strstr(token, "dep")) { m_option.dep = opt; }
        else if (strstr(token, "dbg")) { m_option.dbg = opt; }
      } // end while
    }
  }
  fclose(fp);
  return true;
}

/*
  Parse X version string from XLIB_VER_FILE
*/
bool read_version_file()
{
  int i = 0;
  bool ret;
  FILE *fp;
  char line[XAG_MAX_LINE_LEN], *p;

  *x_ver = 0;
  strcpy(line, lib_path);
  strcat(line, XLIB_VER_FILE);
  if ((fp = fopen(line, "r")) == NULL)
  {
    printf("Warning: Could not find X Library version file: %s%s\n", lib_path, XLIB_VER_FILE);
    return false;
  }

  while (fgets(line, XAG_MAX_LINE_LEN, fp) != NULL)
  {
    p = strstr(line, "version");
    if (p)
    {
      p += 7;
      while (*p && *p != '\"' && *p != '\'')
      {
        ++p;
      }
      ++p;
      while (*p && *p != '\"' && *p != '\'')
      {
        x_ver[i++] = *p++;
      }
      x_ver[i] = 0;
      break; // out of while
    }
  } // end while

  if (!*x_ver)
  {
    printf("Warning: Could not read X Library version from file: %s%s\n", lib_path, XLIB_VER_FILE);
    fclose(fp);
    ret = false;
  }
  else
  {
    printf("building from X Library %s\n", x_ver);
    ret = true;
  }
  fclose(fp);
  return ret;
}

/*
* Open every XML file in the lib folder and parse out the symbol's id, src and type.
*/
bool read_symbol_library()
{
  FILE *fp;
  int i, root_state, src_state, type_state;
  char *p, dir[XAG_MAX_PATH_LEN], pth[XAG_MAX_PATH_LEN], line[XAG_MAX_LINE_LEN];

#ifdef __GNUC__

  DIR *dirptr;
  struct dirent *ent;

  strcpy(dir, lib_path);
  dirptr = opendir(dir);
  if (!dirptr) {
    printf("Error: get_valid_symbols could not find %s%s\n", lib_path, XAG_XML_FILE_MASK);
    return false;
  }
  while ((ent = readdir(dirptr)) != NULL) {
    if (!strstr(ent->d_name, ".xml")) {
      continue;
    }
    strcpy(pth, lib_path);
    strcat(pth, ent->d_name);
    if ((fp = fopen(pth, "r")) == NULL) {
      printf("Error: get_valid_symbols could not find xml file: %s\n", pth);
      closedir(dirptr);
      return false;
    }

#else // WIN32

  long hFile;
  struct _finddata_t fd;

  strcpy(dir, lib_path);
  strcat(dir, XAG_XML_FILE_MASK);
  if ((hFile = _findfirst(dir, &fd)) == -1L) {
    printf("Error: get_valid_symbols could not find %s%s\n", lib_path, XAG_XML_FILE_MASK);
    return false;
  }
  do {
    strcpy(pth, lib_path);
    strcat(pth, fd.name);
    if ((fp = fopen(pth, "r")) == NULL) {
      printf("Error: get_valid_symbols could not find xml file: %s\n", pth);
      _findclose(hFile);
      return false;
    }

#endif // end else WIN32

    root_state = 0;
    src_state = 0;
    type_state = 0;
    while (fgets(line, XAG_MAX_LINE_LEN, fp) != NULL )
    {
      if (root_state == 0)
      {
        if (strstr(line, XAG_XML_ROOT))
        {
          p = strstr(line, "id");
          if (p)
          {
            p += 2;
            while (*p && (*p == ' ' || *p == '\t' || *p == '=' || *p == '\'' || *p == '"'))
            {
              ++p;
            }
            for (i = 0; *p && *p != '\'' && *p != '"'; ++i, ++p)
            {
              m_symbol[m_symbol_len].id[i] = *p;
            }
            m_symbol[m_symbol_len].id[i] = 0;
            ++root_state;
          }
          else
          {
            printf("Warning: invalid xml file: %s\n", pth); // invalid xml file!
          }
        }
      } // end if (root_state == 0)
      else
      {
        if (src_state == 0)
        {
          if (strstr(line, "<sources")) { ++src_state; }
        }
        if (src_state == 1)
        {
          if (strstr(line, "<src")) { ++src_state; }
        }
        if (src_state == 2)
        {
          p = strstr(line, "<file>");
          if (p)
          {
            p += 6;
            skip_white_space(&p);
            for (i = 0; *p && *p != '<' && *p != ' ' && *p != '\t'; ++i, ++p)
            {
              m_symbol[m_symbol_len].src[i] = *p;
            }
            m_symbol[m_symbol_len].src[i] = 0;
            ++src_state;
          }
        } // end if (src_state == 2)
        if (type_state == 0)
        {
          p = strstr(line, "<type>");
          if (p)
          {
            p += 6;
            skip_white_space(&p);
            m_symbol[m_symbol_len].type = toupper(*p);
            ++type_state;
          }
        } // end if (type_state == 0)
      }
    } // end while (fgets

    fclose(fp);

    m_symbol[m_symbol_len].out = false;
    m_symbol[m_symbol_len].dep_len = 0;
    for (i = 0; i < XAG_MAX_SYMBOLS; ++i)
    {
      m_symbol[m_symbol_len].dep[i] = XAG_INVALID;
    }
    ++m_symbol_len;

#ifdef __GNUC__

  }
  closedir(dirptr);

#else // WIN32

  } while (_findnext(hFile, &fd) == 0);
  _findclose(hFile);

#endif // end else WIN32

  return true;
} // end read_symbol_library

/*
 Update symbol table with dependency info from m_symbol[sym_idx].src.
*/
bool get_symbol_dependents(int sym_idx)
{
  int ln = 0;
  FILE *fp;
  char line[XAG_MAX_LINE_LEN], *p, tok_type;
  int dep;

  strcpy(line, lib_path);
  strcat(line, m_symbol[sym_idx].src);
  if ((fp = fopen(line, "r")) == NULL)
  {
    printf("Error: get_symbol_dependents could not find symbol %i file: %s%s\n", sym_idx, lib_path, m_symbol[sym_idx].src);
    return false;
  }

  if (m_option.dbg) {
    printf("X Symbols found in lib file %s:\n", m_symbol[sym_idx].src);
  }

  while (fgets(line, XAG_MAX_LINE_LEN, fp) != NULL )
  {
    ++ln; // line number
    p = line;
    if (*p && *p != '\n')
    {
      p = str_tok(line, g_delimiters, &tok_type);
      while (p != NULL)
      {
        dep = get_symbol_index(p, tok_type);
        if (m_option.dep && dep != XAG_INVALID && dep != sym_idx)
        {
          set_dependent(sym_idx, dep);
          if (m_option.dbg) {
            printf("%s(%i), ", p, dep);
          }
        }
        strcpy(prev_token, p);
        p = str_tok(NULL, g_delimiters, &tok_type);
      }
    }
  }
  fclose(fp);
  return true;
}

/*
 Determine which X lib files get included in the output library
 by searching fname for X symbols.
*/
bool get_app_file_symbols(char *fname)
{
  FILE *fp;
  int ln = 0, sym_idx;
  bool in_scr = false, out_scr = false, is_html = false;
  char line[XAG_MAX_LINE_LEN], *p, tok_type;

  if ((fp = fopen(fname, "r")) == NULL)
  {
    printf("Error: get_app_file_symbols could not find application file: %s\n", fname);
    return false;
  }

  if (strstr(fname, ".htm"))
  {
    is_html = true;
  }

  if (m_option.dbg) {
    printf("X Symbols found in app file %s:\n", fname);
  }

  while (fgets(line, XAG_MAX_LINE_LEN, fp) != NULL )
  {
    ++ln; // app line number
    if (line[0] != '\n')
    {
      if (is_html && !in_scr)
      {
        if (strstr(line, "<script") || strstr(line, "<SCRIPT")) // if at the start of a script element
        {
          in_scr = true;
          if (m_option.dbg) {
            printf("(in_scr on line %i) ", ln);
          }
        }
      }
      if (!is_html || in_scr)
      {
        if (is_html && (strstr(line, "</script>") || strstr(line, "</SCRIPT>"))) // if at the end of a script element
        {
          out_scr = true;
        }
        p = str_tok(line, g_delimiters, &tok_type);
        while (p != NULL)
        {
          sym_idx = get_symbol_index(p, tok_type);
          if (sym_idx != XAG_INVALID)
          {
            include_symbol(sym_idx);
            if (m_option.dbg) {
              printf("%s(%i), ", p, sym_idx);
            }
          }
          strcpy(prev_token, p);
          p = str_tok(NULL, g_delimiters, &tok_type);
        }
        if (out_scr)
        {
          in_scr = out_scr = false;
          if (m_option.dbg) {
            printf("(out_scr on line %i) ", ln);
          }
        }
      }
    }
  }
  fclose(fp);
  return true;
}

/*
 Create the output library file.
*/
bool create_output_file()
{
  int i, a = 0, sym_idx;
  FILE *out_fp;
  char tm_str[10];
  time_t tm;

  if (!out_file[0]) {
    strcpy(out_file, prj_name);
    strcat(out_file, XAG_LIB_EXT);
  }
  if ((out_fp = fopen(out_file, "w")) == NULL)
  {
    printf("Error: Could not create output file: %s\n", out_file);
    return false;
  }

  tm = time(NULL);
  strftime(tm_str, 9, "%d%b%y", gmtime(&tm));
  fprintf(out_fp, XLIB_BANNER, x_ver, XAG_VER, tm_str);

  // For every symbol which has 'm_symbol[sym_idx].inc > 0'
  // include m_symbol[sym_idx].src in the output.

  if (m_option.dbg) {
    printf("Appending Symbol Files\n");
  }
  for (sym_idx = 0; sym_idx < m_symbol_len; ++sym_idx)
  {
    if (m_symbol[sym_idx].inc)
    {
      if (m_option.dbg) {
        printf("%s(%i), ", m_symbol[sym_idx].src, sym_idx);
      }
      if (!append_to_output(out_fp, m_symbol[sym_idx].src, sym_idx)) {
        printf("\nWarning: Could not add %s%s to output\n", m_symbol[sym_idx].src, XAG_LIB_EXT);
      }
    }
  }
  if (m_option.dbg) {
    printf("\n");
  }

  if (m_option.app)
  {
    if (m_option.dbg) {
      printf("Appending App Files\n");
    }

    fprintf(out_fp, "\n/* Application */\n");

    // Include the app Js files in the output.
    for (i = 0; i < m_app_file_len; ++i)
    {
      if (strstr(m_app_file[i], XAG_LIB_EXT))
      {
        if (m_option.dbg) {
          printf("%s(%i), ", m_app_file[i], i);
        }
        if (append_to_output(out_fp, m_app_file[i], XAG_INVALID))
        {
          ++a;
        }
      }
    }
    if (m_option.dbg) {
      printf("\n");
    }
    if (a) fprintf(out_fp, "\n");
  } // end if (m_option.app)

  fclose(out_fp);
  return true;
}

/*
 Appends name to the output library js file. Applies optional compression,
 optional function name obfuscation and optional function name object prefix.
*/
bool append_to_output(FILE *out_fp, char *name, int sym_idx)
{
  int ln = 0;
  FILE *lib_fp;
  bool is_app_file;
  char lib_name[XAG_MAX_PATH_LEN], line[XAG_MAX_LINE_LEN];

  if (sym_idx == XAG_INVALID) // append an app file
  {
    strcpy(lib_name, name);
    is_app_file = true;
  }
  else // append a sym file
  {
    if (m_symbol[sym_idx].out) return true;
    strcpy(lib_name, lib_path);
    strcat(lib_name, name);
    is_app_file = false;
  }

  if ((lib_fp = fopen(lib_name, "r")) == NULL)
  {
    printf("Error: append_to_output could not find file: %s\n", lib_name);
    return false;
  }

  while (fgets(line, XAG_MAX_LINE_LEN, lib_fp) != NULL )
  {
    ++ln; // line number
    if (fputs(line, out_fp) == EOF)
    {
      fclose(lib_fp);
      printf("Error: Could not write to output file: %s\n", out_file);
      return false;
    }
  } // end while (fgets

  fclose(lib_fp);
  if (!is_app_file) // appended a symbol file, not an app file
  {
    set_symbol_complete(name); // indicate that this file has been output
  }
  return true;
}

/*
 Determine if token matches an ID in the symbol table.
 If sym_type is 'P' or 'M' then the token searched for
 is: "prev_token.token".
*/
int get_symbol_index(char *token, char sym_type)
{
  int i, idx = XAG_INVALID;
  char tok[XAG_MAX_NAME_LEN];

  if (sym_type == 'P' || sym_type == 'M') {
    strcpy(tok, prev_token);
    strcat(tok, ".");
    strcat(tok, token);
//    printf("\n\nprev_token: %s\ntok: %s\ntype: %c\n\n", prev_token, tok, sym_type);////////////
  }
  else {
    strcpy(tok, token);
  }
  for (i = 0; i < m_symbol_len; ++i) {
    if (!strcmp(tok, m_symbol[i].id)) { // token == id
      idx = i;
      break; // out of 'for'
    }
  }
  return idx;
}

/*
 if the 'm_symbol[sym_idx].dep' array does not already contain 'dep'
 then assign 'dep' to the next available array element.
*/
void set_dependent(int sym_idx, int dep)
{
  int i;

  for (i = 0; i < m_symbol[sym_idx].dep_len; ++i) {
    if (m_symbol[sym_idx].dep[i] == dep) {
      return;
    }
  }
  m_symbol[sym_idx].dep[m_symbol[sym_idx].dep_len++] = dep;
}

/*
 Indicate the X lib file m_symbol[sym_idx] (and all it's dependents)
 to be included in the output library file.
*/
void include_symbol(int sym_idx)
{
  int i;

  if (sym_idx >= m_symbol_len) {
    return;
  }
  if (!m_symbol[sym_idx].inc++) {
    for (i = 0; i < m_symbol[sym_idx].dep_len; ++i) {
      include_symbol(m_symbol[sym_idx].dep[i]);
    }
  }
}

/*
 For every symbol with src == s, mark that symbol
 as having been included in the output.
*/
void set_symbol_complete(char *s)
{
  int i;

  if (s && *s) {
    for (i = 0; i < m_symbol_len; ++i) {
      if (!strcmp(s, m_symbol[i].src)) {
        m_symbol[i].out = true;
      }
    }
  }
}

/*
 This is the comparison function passed to 'qsort' when sorting the
 symbol table. Symbols are sorted by type and then by id. The type
 precedence is: V, O, P, M, F.
*/
int compare_fn(const void *ele1, const void *ele2)
{
  int ret = 0;
  t_symbol *s1, *s2;

  s1 = (t_symbol *)ele1;
  s2 = (t_symbol *)ele2;
  ret = strcmp(s1->id, s2->id);
  // Variables come before all other types.
  if (s1->type == 'V')
  {
    if (s2->type != 'V') ret = -1;
  }
  else if (s2->type == 'V')
  {
    if (s1->type != 'V') ret = 1;
  }
  // Objects come next.
  else if (s1->type == 'O')
  {
    if (s2->type != 'O') ret = -1;
  }
  else if (s2->type == 'O')
  {
    if (s1->type != 'O') ret = 1;
  }
  // Properties come next.
  else if (s1->type == 'P')
  {
    if (s2->type != 'P') ret = -1;
  }
  else if (s2->type == 'P')
  {
    if (s1->type != 'P') ret = 1;
  }
  // Methods come next.
  else if (s1->type == 'M')
  {
    if (s2->type != 'M') ret = -1;
  }
  else if (s2->type == 'M')
  {
    if (s1->type != 'M') ret = 1;
  }
  // Functions come last.
  // Return the comparison result:
  return ret;
}

/*
 Display project info, app file list and symbol table info.
*/
void show_debug_info()
{
  int i, j;
  char n[6];

  printf("\nProject Info:\n");
  printf("project file: %s%s\n", prj_name, prj_ext);
  printf("output lib file: %s%s\n", prj_name, XAG_LIB_EXT);
  printf("library path: %s\n", lib_path);
  printf("options: lib=%i, app=%i, dep=%i, dbg=%i\n",
          m_option.lib,
          m_option.app,
          m_option.dep,
          m_option.dbg);

  printf("Application Files:\n\n");
  for (i = 0; i < m_app_file_len; ++i)
  {
    printf("%i: %s\n", i, m_app_file[i]);
  }

  printf("Output File:\n");
  if (m_option.lib) printf(" %s%s", prj_name, XAG_LIB_EXT);

  printf("Symbol Table:\n");
  for (i = 0; i < m_symbol_len; ++i)
  {
    printf("%i(%s): %s(inc=%i)(src=%s)(type=%c)", i, uitoa(i,n,36), m_symbol[i].id, m_symbol[i].inc, m_symbol[i].src, m_symbol[i].type);
    for (j = 0; j < m_symbol[i].dep_len; ++j)
    {
      // name(number)
      printf(", %s(%i)", m_symbol[m_symbol[i].dep[j]].id, m_symbol[i].dep[j]);
    }
    printf("\n");
  }

  printf("Symbols:\n");
  for (i = 0; i < m_symbol_len; ++i)
  {
    printf("%s\n", m_symbol[i].id);
  }
}

// end xag.c
