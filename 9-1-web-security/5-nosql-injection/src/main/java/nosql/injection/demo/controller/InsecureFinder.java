package nosql.injection.demo.controller;

import nosql.injection.demo.model.InjectionResult;
import nosql.injection.demo.model.NoSQLDatabase;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public class InsecureFinder extends HttpServlet {

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String name = request.getParameter("name");

        NoSQLDatabase noSQLDatabase = NoSQLDatabase.getInstance();
        InjectionResult result = noSQLDatabase.insecureFindByName(name);

        request.setAttribute("result", result);

        RequestDispatcher rd = getServletContext().getRequestDispatcher("/InjectionResult.jsp");
        rd.forward(request, response);
    }
}
