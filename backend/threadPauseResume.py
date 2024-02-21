
import threading
import time
import keyboard
def thread_task():
    thread_event.wait()  # Wait until the event is set
    print("Thread is now resumed.")
    # time.sleep(2)
    for i in range(3):
        print(f'Running #{i+1}')
    print("Thread task completed.")



thread_event = threading.Event()
thread = threading.Thread(target=thread_task)



thread.start()
# thread_event.set()
# print("Running the thread...")



time.sleep(1)

print("Pausing the thread...")
thread_event.clear()

time.sleep(3)
print("Resuming the thread...")
thread_event.set()

thread.join()
print("Program completed.")