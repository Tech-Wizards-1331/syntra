from django.contrib.auth.hashers import PBKDF2PasswordHasher

class FastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """
    A subclass of PBKDF2PasswordHasher that uses significantly fewer iterations.
    Django 5.x defaults to over 720,000 iterations, which can take 3-5 seconds 
    on weak free-tier server CPUs (Render, Railway, etc.).
    
    Reducing to 50,000 drops the hash time dramatically while still offering
    a reasonable baseline of security for a hackathon/university project.
    """
    iterations = 50000
