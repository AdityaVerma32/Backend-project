// Message that will be sent when sending error response

class ApiErrors extends Error{
    constructor(
        statusCode,
        message ="Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode=statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors= errors;


        // not compulsory for deployment 
        // used by debugger for knowing the current stack for error
        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiErrors}