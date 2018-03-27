package edu.brown.cs.rwdodd.maps;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import joptsimple.OptionParser;
import joptsimple.OptionSet;
import joptsimple.OptionSpec;
import spark.ExceptionHandler;
import spark.ModelAndView;
import spark.QueryParamsMap;
import spark.Request;
import spark.Response;
import spark.Route;
import spark.Spark;
import spark.TemplateViewRoute;
import spark.template.freemarker.FreeMarkerEngine;

import com.google.common.collect.ImmutableMap;
import com.google.gson.Gson;

import freemarker.template.Configuration;

/**
 * @author rwdodd
 *
 */
public class Main {
  private File file;
  private static DbQuery sparkDb;
  private List<String> strings;
  private Integer portNum;
  private String[] args;
  private final static Gson GSON = new Gson();

  /**
   * @param args the command line args
   */
  public static void main(String[] args) {

    new Main(args).run();
  }


  /**
   * @param args the command line args.
   */
  private Main(String[] args) {
    this.args = args;
  }

  /**
   * runs app.
   */
  private void run() {

    OptionParser parser = new OptionParser();
    parser.accepts("gui");
    OptionSpec<File> fileSpec = parser.nonOptions().ofType(File.class);
    OptionSet options = parser.parse(args);

    file = options.valueOf(fileSpec);
    runSparkServer();
  }

  private static FreeMarkerEngine createEngine() {
    Configuration config = new Configuration();
    File templates
    = new File("src/main/resources/spark/template/freemarker");
    try {
      config.setDirectoryForTemplateLoading(templates);
    } catch (IOException ioe) {
      System.out.printf("ERROR: Unable use %s for template loading.\n",
          templates);
      System.exit(1);
    }
    return new FreeMarkerEngine(config);
  }

  private void runSparkServer() {
    Spark.externalStaticFileLocation("src/main/resources/static");
    Spark.exception(Exception.class, new ExceptionPrinter());
    try {
      sparkDb = new DbQuery(file);
    } catch (ClassNotFoundException e) {
      e.printStackTrace();
    } catch (SQLException e) {
      e.printStackTrace();
    }


    FreeMarkerEngine freeMarker = createEngine();
    // Setup Spark Routes
    Spark.get("/home", new FrontHandler(), freeMarker);
    Spark.post("/update", new UpdateHandler());
  }

  /**
   * @author rwdodd
   *
   */
  private class FrontHandler implements TemplateViewRoute {
    /* (non-Javadoc)
     * @see spark.TemplateViewRoute#handle(spark.Request, spark.Response)
     */
    @Override
    public ModelAndView handle(Request req, Response res) {
      Map<String, Object> variables = ImmutableMap.of("title",
          "Maps");
      return new ModelAndView(variables, "play.ftl");

    }
  }

  /**
   * @author rwdodd
   *
   */
  private class UpdateHandler implements Route {
    /* (non-Javadoc)
     * @see spark.TemplateViewRoute#handle(spark.Request, spark.Response)
     */
    @Override

public Object handle(final Request req, final Response res) {
  QueryParamsMap qm = req.queryMap();

  List<Road> results = new ArrayList<Road>();

  Double tileSize = Double.parseDouble(qm.value("tileSize"));
  Double lat = Double.parseDouble(qm.value("lat"));
  Double lng = Double.parseDouble(qm.value("long"));
      try {
        
        results = sparkDb.queryWays(lat, lng, lat - tileSize, lng + tileSize);
      } catch (SQLException e) {
        e.printStackTrace();
      }



  Map<String, Object> variables = new ImmutableMap.Builder<String, Object>()
  .put("tile", results).build();

  return GSON.toJson(variables);

}
  }

  /**
   * @author rwdodd
   *
   */
  private static class ExceptionPrinter implements ExceptionHandler {
    private final Integer STATUS = 500;
    /* (non-Javadoc)
     * @see spark.ExceptionHandler#handle(java.lang.Exception, spark.Request, spark.Response)
     */
    @Override
    public void handle(Exception e, Request req, Response res) {
      res.status(STATUS);
      StringWriter stacktrace = new StringWriter();
      try (PrintWriter pw = new PrintWriter(stacktrace)) {
        pw.println("<pre>");
        e.printStackTrace(pw);
        pw.println("</pre>");
      }
      res.body(stacktrace.toString());
    }
  }
}
