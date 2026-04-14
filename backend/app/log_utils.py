import logging
import sys
import os

def setup_logging(name: str = "app"):
    """
    Configures a unified logger for the application.
    In production, this could be configured to send logs to a centralized system.
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if setup_logging is called multiple times
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger

# Create a default logger instance
logger = setup_logging()
